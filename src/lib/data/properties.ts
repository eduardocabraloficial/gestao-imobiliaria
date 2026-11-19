import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { demoAdminProperties, demoInterestLinks } from "@/lib/demo-properties";
import { clients as demoClients } from "@/lib/demo-data";
import { clientRowToView } from "@/lib/crm";
import { createSupabasePublicClient, createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { filterPublicProperties, toPublicProperty, type PublicPropertyFilters } from "@/lib/public-properties";
import { phase5DemoStore } from "@/lib/demo-phase5";
import type { AdminProperty, Client, Property, PropertyImage, PropertyInterest } from "@/types";
import type { ClientPropertyInterestRow, ClientRow, FollowUpRow, InteractionRow, PropertyImageRow, PropertyRow } from "@/types/database";

export function propertyRowToView(row: PropertyRow, images: PropertyImage[] = []): AdminProperty {
  return {
    id: row.id, code: row.code, title: row.title, purpose: row.purpose, propertyType: row.property_type,
    description: row.description ?? "", price: Number(row.price), condominiumFee: row.condominium_fee === null ? null : Number(row.condominium_fee),
    iptu: row.iptu === null ? null : Number(row.iptu), address: row.address ?? "", neighborhood: row.neighborhood,
    city: row.city, state: row.state, zipCode: row.zip_code ?? "", area: row.area === null ? null : Number(row.area),
    bedrooms: row.bedrooms, suites: row.suites, bathrooms: row.bathrooms, parkingSpaces: row.parking_spaces,
    furnished: row.furnished, petsAllowed: row.pets_allowed, featured: row.featured, status: row.status,
    imageUrl: row.image_url ?? "", slug: row.slug, isPublic: row.is_public, characteristics: row.characteristics ?? [], images,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

async function imageViews(rows: PropertyImageRow[]) {
  if (!rows.length) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage.from("property-images").createSignedUrls(rows.map((row) => row.storage_path), 3600);
  return rows.map((row, index) => ({ id: row.id, propertyId: row.property_id, storagePath: row.storage_path, url: data?.[index]?.signedUrl ?? "", isCover: row.is_cover, sortOrder: row.sort_order }));
}

export async function listAdminProperties(): Promise<{ properties: AdminProperty[]; demoMode: boolean }> {
  if (!isSupabaseConfigured()) return { properties: demoAdminProperties, demoMode: true };
  const user = await getCurrentUser();
  if (!user) return { properties: [], demoMode: false };
  const supabase = await createSupabaseServerClient();
  const [{ data, error }, imageResult] = await Promise.all([
    supabase.from("properties").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("property_images").select("*").eq("user_id", user.id).order("sort_order"),
  ]);
  if (error) throw new Error(`Não foi possível carregar os imóveis: ${error.message}`);
  const images = await imageViews((imageResult.data ?? []) as PropertyImageRow[]);
  return { properties: ((data ?? []) as PropertyRow[]).map((row) => propertyRowToView(row, images.filter((image) => image.propertyId === row.id))), demoMode: false };
}

export async function listPublicProperties(filters: PublicPropertyFilters = {}): Promise<Property[]> {
  if (!isSupabaseConfigured()) return filterPublicProperties(demoAdminProperties, filters).map((property) => toPublicProperty(property, true));
  const supabase = createSupabasePublicClient();
  const propertiesResult = await supabase.from("properties").select("id,code,title,purpose,property_type,description,price,condominium_fee,iptu,neighborhood,city,state,area,bedrooms,suites,bathrooms,parking_spaces,furnished,pets_allowed,featured,image_url,slug,is_public,characteristics,created_at,updated_at,status").eq("is_public", true).eq("status", "disponivel").order("created_at", { ascending: false });
  if (propertiesResult.error) return [];
  const rows = (propertiesResult.data ?? []) as PropertyRow[];
  const propertyIds = rows.map((row) => row.id);
  const imagesResult = propertyIds.length
    ? await supabase.from("property_images").select("id,property_id,storage_path,is_cover,sort_order,created_at").in("property_id", propertyIds).order("sort_order")
    : { data: [], error: null };
  const imageRows = (imagesResult.data ?? []) as PropertyImageRow[];
  const signed = imageRows.length
    ? await supabase.storage.from("property-images").createSignedUrls(imageRows.map((row) => row.storage_path), 3600)
    : { data: [], error: null };
  const images = signed.error ? [] : imageRows.map((row, index) => ({ id: row.id, propertyId: row.property_id, storagePath: row.storage_path, url: signed.data?.[index]?.signedUrl ?? "", isCover: row.is_cover, sortOrder: row.sort_order }));
  const admin = rows.map((row) => propertyRowToView(row, images.filter((image) => image.propertyId === row.id)));
  return filterPublicProperties(admin, filters).map((property) => toPublicProperty(property, false));
}

export async function getPublicProperty(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const properties = await listPublicProperties();
  return properties.find((property) => property.slug === slug) ?? null;
}

export async function getAdminProperty(id: string): Promise<{ property: AdminProperty | null; interestedClients: Client[]; demoMode: boolean }> {
  if (!isSupabaseConfigured()) {
    const property = demoAdminProperties.find((item) => item.id === id) ?? null;
    const clientIds = demoInterestLinks.filter((item) => item.propertyId === id).map((item) => item.clientId);
    return { property, interestedClients: demoClients.filter((client) => clientIds.includes(client.id)), demoMode: true };
  }
  const user = await getCurrentUser();
  if (!user) return { property: null, interestedClients: [], demoMode: false };
  const supabase = await createSupabaseServerClient();
  const [propertyResult, linksResult, clientsResult, interactionsResult, followUpsResult, imagesResult] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("client_property_interests").select("*").eq("property_id", id).eq("user_id", user.id),
    supabase.from("clients").select("*").eq("user_id", user.id),
    supabase.from("interactions").select("*").eq("user_id", user.id),
    supabase.from("follow_ups").select("*").eq("user_id", user.id),
    supabase.from("property_images").select("*").eq("property_id", id).eq("user_id", user.id).order("sort_order"),
  ]);
  if (propertyResult.error) throw new Error(`Não foi possível carregar o imóvel: ${propertyResult.error.message}`);
  const links = (linksResult.data ?? []) as ClientPropertyInterestRow[];
  const ids = new Set(links.map((link) => link.client_id));
  const interactions = (interactionsResult.data ?? []) as InteractionRow[];
  const followUps = (followUpsResult.data ?? []) as FollowUpRow[];
  const clients = ((clientsResult.data ?? []) as ClientRow[]).filter((row) => ids.has(row.id)).map((row) => clientRowToView(row, interactions, followUps, user.name));
  const images = await imageViews((imagesResult.data ?? []) as PropertyImageRow[]);
  return { property: propertyResult.data ? propertyRowToView(propertyResult.data as PropertyRow, images) : null, interestedClients: clients, demoMode: false };
}

export async function getClientPropertyInterests(clientId: string): Promise<{ interests: PropertyInterest[]; availableProperties: AdminProperty[]; demoMode: boolean }> {
  const { properties, demoMode } = await listAdminProperties();
  if (demoMode) {
    const dynamic = phase5DemoStore.leads.filter((lead) => lead.convertedClientId === clientId).map((lead) => ({ id: `demo-interest-${lead.id}`, clientId, propertyId: lead.propertyId, notes: "Interesse originado pelo portal público." }));
    const links = [...demoInterestLinks.filter((item) => item.clientId === clientId), ...dynamic];
    return { interests: links.map((link) => ({ ...link, property: properties.find((item) => item.id === link.propertyId) })), availableProperties: properties, demoMode: true };
  }
  const user = await getCurrentUser();
  if (!user) return { interests: [], availableProperties: [], demoMode: false };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("client_property_interests").select("*").eq("client_id", clientId).eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os imóveis de interesse: ${error.message}`);
  const links = (data ?? []) as ClientPropertyInterestRow[];
  return { interests: links.map((link) => ({ id: link.id, clientId: link.client_id, propertyId: link.property_id, notes: link.notes ?? "", property: properties.find((item) => item.id === link.property_id) })), availableProperties: properties, demoMode: false };
}

export async function getPropertyStats() {
  const { properties } = await listAdminProperties();
  return {
    available: properties.filter((item) => item.status === "disponivel").length,
    reserved: properties.filter((item) => item.status === "reservado").length,
    closed: properties.filter((item) => item.status === "vendido" || item.status === "alugado").length,
  };
}
