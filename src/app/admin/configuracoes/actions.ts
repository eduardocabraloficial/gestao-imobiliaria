"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { phase6DemoStore } from "@/lib/demo-phase6";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { OrganizationSettings } from "@/types";

const color = /^#[0-9a-f]{6}$/i;
export async function saveSettingsAction(input: OrganizationSettings) {
  if ((input.email && !/^\S+@\S+\.\S+$/.test(input.email)) || !color.test(input.primaryColor) || !color.test(input.secondaryColor)) return { success: false, message: "Revise o e-mail e as cores informadas." };
  if (!isSupabaseConfigured()) { phase6DemoStore.settings = { ...input, id: "demo-settings" }; return { success: true, message: "Configurações salvas." }; }
  const user = await getCurrentUser(); if (!user) return { success: false, message: "Sua sessão expirou." }; const supabase = await createSupabaseServerClient();
  const payload = { user_id: user.id, business_name: input.businessName.trim() || null, trade_name: input.tradeName.trim() || null, creci: input.creci.trim() || null, phone: input.phone.trim() || null, whatsapp: input.whatsapp.trim() || null, email: input.email.trim() || null, address: input.address.trim() || null, instagram: input.instagram.trim() || null, website: input.website.trim() || null, description: input.description.trim() || null, logo_path: input.logoPath.trim() || null, primary_color: input.primaryColor, secondary_color: input.secondaryColor, hero_title: input.heroTitle.trim() || null, hero_subtitle: input.heroSubtitle.trim() || null, footer_text: input.footerText.trim() || null };
  const { error } = await supabase.from("organization_settings").upsert(payload, { onConflict: "user_id" }); if (error) return { success: false, message: "Não foi possível salvar as configurações." };
  revalidatePath("/admin/configuracoes"); return { success: true, message: "Configurações salvas." };
}

export async function updateProfileAction(name: string, phone: string, email: string) {
  if (name.trim().length < 2 || (email && !/^\S+@\S+\.\S+$/.test(email))) return { success: false, message: "Revise os dados do perfil." };
  if (!isSupabaseConfigured()) return { success: true, message: "Perfil atualizado no modo demonstrativo." };
  const user = await getCurrentUser(); if (!user) return { success: false, message: "Sua sessão expirou." }; const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ full_name: name.trim(), phone: phone.trim() || null, email: email.trim() }).eq("id", user.id);
  if (error) return { success: false, message: "Não foi possível atualizar o perfil." };
  if (email.trim() && email.trim() !== user.email) await supabase.auth.updateUser({ email: email.trim() });
  revalidatePath("/admin/configuracoes"); return { success: true, message: "Perfil atualizado. Uma confirmação pode ser enviada ao novo e-mail." };
}
