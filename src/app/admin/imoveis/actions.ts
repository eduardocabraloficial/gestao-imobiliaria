"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PropertyInput } from "@/types";
import type { ActionResult } from "@/app/admin/clientes/actions";
import { imageExtension, isSafeImageFile } from "@/lib/upload-security";

function validateProperty(input: PropertyInput) {
  if (input.code.trim().length < 2 || input.code.trim().length > 40) return "Informe um código entre 2 e 40 caracteres.";
  if (input.title.trim().length < 3 || input.title.trim().length > 160) return "Informe um título entre 3 e 160 caracteres.";
  if (!input.propertyType.trim() || input.propertyType.length > 80) return "Informe um tipo de imóvel válido.";
  if (!["venda", "aluguel"].includes(input.purpose) || !["disponivel", "reservado", "vendido", "alugado", "inativo"].includes(input.status)) return "Finalidade ou situação inválida.";
  if (!Number.isFinite(input.price) || input.price < 0) return "O preço não pode ser negativo.";
  if (!input.neighborhood.trim() || !input.city.trim() || input.state.trim().length !== 2) return "Informe bairro, cidade e UF.";
  if (input.description.length > 5000 || input.address.length > 300) return "Descrição ou endereço excede o limite permitido.";
  if (input.imageUrl.trim()) { try { const url = new URL(input.imageUrl); if (!["http:", "https:"].includes(url.protocol)) return "Informe uma URL de imagem HTTP ou HTTPS."; } catch { return "Informe uma URL de imagem válida."; } }
  return null;
}

function databasePayload(input: PropertyInput) {
  return {
    code: input.code.trim().toUpperCase(), title: input.title.trim(), purpose: input.purpose,
    property_type: input.propertyType.trim(), description: input.description.trim() || null, price: input.price,
    condominium_fee: input.condominiumFee, iptu: input.iptu, address: input.address.trim() || null,
    neighborhood: input.neighborhood.trim(), city: input.city.trim(), state: input.state.trim().toUpperCase(),
    zip_code: input.zipCode.trim() || null, area: input.area, bedrooms: input.bedrooms, suites: input.suites,
    bathrooms: input.bathrooms, parking_spaces: input.parkingSpaces, furnished: input.furnished,
    pets_allowed: input.petsAllowed, featured: input.featured, status: input.status,
    image_url: input.imageUrl.trim() || null, is_public: input.isPublic, characteristics: input.characteristics.map((item) => item.trim()).filter(Boolean).slice(0, 30),
  };
}

export async function uploadPropertyImagesAction(propertyId: string, formData: FormData): Promise<ActionResult> {
  const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  if (!files.length || files.length > 4) return { success: false, message: "Selecione de 1 a 4 imagens por envio." };
  if (files.some((file) => file.size > 8 * 1024 * 1024) || files.reduce((total, file) => total + file.size, 0) > 32 * 1024 * 1024) return { success: false, message: "Use no máximo 32 MB por envio e 8 MB por imagem." };
  if (!(await Promise.all(files.map(isSafeImageFile))).every(Boolean)) return { success: false, message: "Use arquivos JPG, PNG ou WebP válidos e com extensão compatível." };
  if (!isSupabaseConfigured()) return { success: true, message: "Imagens validadas no modo demonstrativo.", demo: true };
  const current = await context(); if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const property = await current.supabase.from("properties").select("id").eq("id", propertyId).eq("user_id", current.user.id).maybeSingle();
  if (!property.data) return { success: false, message: "Imóvel não encontrado." };
  const existing = await current.supabase.from("property_images").select("id, sort_order").eq("property_id", propertyId).eq("user_id", current.user.id);
  let order = existing.data?.length ?? 0;
  for (const file of files) {
    const extension = imageExtension(file.type)!;
    const path = `${current.user.id}/${propertyId}/${crypto.randomUUID()}.${extension}`;
    const upload = await current.supabase.storage.from("property-images").upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) return { success: false, message: "Não foi possível enviar uma das imagens." };
    const inserted = await current.supabase.from("property_images").insert({ property_id: propertyId, user_id: current.user.id, storage_path: path, sort_order: order, is_cover: order === 0 }).select("id").single();
    if (inserted.error) { await current.supabase.storage.from("property-images").remove([path]); return { success: false, message: "Não foi possível registrar uma das imagens." }; }
    order += 1;
  }
  revalidatePath(`/admin/imoveis/${propertyId}`); revalidatePath("/"); revalidatePath("/imoveis");
  return { success: true, message: "Imagens enviadas com sucesso." };
}

export async function setPropertyCoverAction(propertyId: string, imageId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true, message: "Capa atualizada.", demo: true };
  const current = await context(); if (!current) return { success: false, message: "Sua sessão expirou." };
  const owned = await current.supabase.from("property_images").select("id").eq("id", imageId).eq("property_id", propertyId).eq("user_id", current.user.id).maybeSingle();
  if (!owned.data) return { success: false, message: "Imagem não encontrada." };
  await current.supabase.from("property_images").update({ is_cover: false }).eq("property_id", propertyId).eq("user_id", current.user.id);
  const { error } = await current.supabase.from("property_images").update({ is_cover: true }).eq("id", imageId).eq("user_id", current.user.id);
  if (error) return { success: false, message: "Não foi possível definir a capa." };
  revalidatePath(`/admin/imoveis/${propertyId}`); revalidatePath("/"); revalidatePath("/imoveis");
  return { success: true, message: "Capa atualizada." };
}

export async function removePropertyImageAction(propertyId: string, imageId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true, message: "Imagem removida.", demo: true };
  const current = await context(); if (!current) return { success: false, message: "Sua sessão expirou." };
  const { data } = await current.supabase.from("property_images").select("storage_path, is_cover").eq("id", imageId).eq("property_id", propertyId).eq("user_id", current.user.id).maybeSingle();
  if (!data) return { success: false, message: "Imagem não encontrada." };
  const removed = await current.supabase.storage.from("property-images").remove([String(data.storage_path)]);
  if (removed.error) return { success: false, message: "Não foi possível remover a imagem." };
  await current.supabase.from("property_images").delete().eq("id", imageId).eq("user_id", current.user.id);
  if (data.is_cover) {
    const { data: next } = await current.supabase.from("property_images").select("id").eq("property_id", propertyId).eq("user_id", current.user.id).order("sort_order").limit(1).maybeSingle();
    if (next) await current.supabase.from("property_images").update({ is_cover: true }).eq("id", next.id).eq("user_id", current.user.id);
  }
  revalidatePath(`/admin/imoveis/${propertyId}`); revalidatePath("/"); revalidatePath("/imoveis");
  return { success: true, message: "Imagem removida." };
}

async function context() {
  const user = await getCurrentUser();
  return user ? { user, supabase: await createSupabaseServerClient() } : null;
}

export async function createPropertyAction(input: PropertyInput): Promise<ActionResult> {
  const validation = validateProperty(input);
  if (validation) return { success: false, message: validation };
  if (!isSupabaseConfigured()) return { success: true, message: "Imóvel cadastrado com sucesso.", demo: true, id: `demo-${Date.now()}` };
  const current = await context();
  if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { data, error } = await current.supabase.from("properties").insert({ ...databasePayload(input), user_id: current.user.id }).select("id").single();
  if (error) return { success: false, message: error.code === "23505" ? "Já existe um imóvel com este código." : "Não foi possível cadastrar o imóvel." };
  revalidatePath("/admin"); revalidatePath("/admin/imoveis"); revalidatePath("/"); revalidatePath("/imoveis");
  return { success: true, message: "Imóvel cadastrado com sucesso.", id: data.id };
}

export async function updatePropertyAction(id: string, input: PropertyInput): Promise<ActionResult> {
  const validation = validateProperty(input);
  if (validation) return { success: false, message: validation };
  if (!isSupabaseConfigured()) return { success: true, message: "Imóvel atualizado com sucesso.", demo: true };
  const current = await context();
  if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await current.supabase.from("properties").update(databasePayload(input)).eq("id", id).eq("user_id", current.user.id);
  if (error) return { success: false, message: error.code === "23505" ? "Já existe um imóvel com este código." : "Não foi possível atualizar o imóvel." };
  revalidatePath("/admin"); revalidatePath("/admin/imoveis"); revalidatePath(`/admin/imoveis/${id}`); revalidatePath("/"); revalidatePath("/imoveis");
  return { success: true, message: "Imóvel atualizado com sucesso." };
}

export async function addPropertyInterestAction(clientId: string, propertyId: string, notes: string): Promise<ActionResult> {
  if (!propertyId) return { success: false, message: "Selecione um imóvel." };
  if (!isSupabaseConfigured()) return { success: true, message: "Imóvel vinculado ao cliente.", demo: true, id: `demo-interest-${Date.now()}` };
  const current = await context();
  if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const [clientResult, propertyResult] = await Promise.all([
    current.supabase.from("clients").select("id").eq("id", clientId).eq("user_id", current.user.id).maybeSingle(),
    current.supabase.from("properties").select("id").eq("id", propertyId).eq("user_id", current.user.id).maybeSingle(),
  ]);
  if (!clientResult.data || !propertyResult.data) return { success: false, message: "Cliente ou imóvel não encontrado." };
  const { data, error } = await current.supabase.from("client_property_interests").insert({ user_id: current.user.id, client_id: clientId, property_id: propertyId, notes: notes.trim() || null }).select("id").single();
  if (error) return { success: false, message: error.code === "23505" ? "Este imóvel já está vinculado ao cliente." : "Não foi possível vincular o imóvel." };
  revalidatePath(`/admin/clientes/${clientId}`); revalidatePath(`/admin/imoveis/${propertyId}`);
  return { success: true, message: "Imóvel vinculado ao cliente.", id: data.id };
}

export async function removePropertyInterestAction(interestId: string, clientId: string, propertyId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true, message: "Vínculo removido.", demo: true };
  const current = await context();
  if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await current.supabase.from("client_property_interests").delete().eq("id", interestId).eq("user_id", current.user.id).eq("client_id", clientId).eq("property_id", propertyId);
  if (error) return { success: false, message: "Não foi possível remover o vínculo." };
  revalidatePath(`/admin/clientes/${clientId}`); revalidatePath(`/admin/imoveis/${propertyId}`);
  return { success: true, message: "Vínculo removido." };
}
