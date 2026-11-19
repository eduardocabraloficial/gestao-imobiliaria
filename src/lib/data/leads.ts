import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { phase5DemoStore } from "@/lib/demo-phase5";
import { demoAdminProperties } from "@/lib/demo-properties";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Lead } from "@/types";
import type { LeadRow, PropertyRow } from "@/types/database";

export async function listLeads(): Promise<{ leads: Lead[]; demoMode: boolean }> {
  if (!isSupabaseConfigured()) return { leads: [...phase5DemoStore.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), demoMode: true };
  const user = await getCurrentUser();
  if (!user) return { leads: [], demoMode: false };
  const supabase = await createSupabaseServerClient();
  const [leadResult, propertyResult] = await Promise.all([
    supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("properties").select("*").eq("user_id", user.id),
  ]);
  if (leadResult.error) throw new Error("Não foi possível carregar os leads.");
  const properties = (propertyResult.data ?? []) as PropertyRow[];
  return { leads: ((leadResult.data ?? []) as LeadRow[]).map((row) => {
    const property = properties.find((item) => item.id === row.property_id);
    return { id: row.id, propertyId: row.property_id, propertyCode: property?.code ?? "—", propertyTitle: property?.title ?? "Imóvel indisponível", propertySlug: property?.slug ?? "", name: row.name, phone: row.phone, whatsapp: row.whatsapp ?? "", email: row.email, message: row.message, source: "site", status: row.status, createdAt: row.created_at, convertedAt: row.converted_at, convertedClientId: row.converted_client_id };
  }), demoMode: false };
}

export async function getLead(id: string) {
  const { leads, demoMode } = await listLeads();
  return { lead: leads.find((lead) => lead.id === id) ?? null, demoMode };
}

export async function getLeadStats() {
  const { leads } = await listLeads();
  return { newCount: leads.filter((lead) => lead.status === "novo").length, recent: leads.slice(0, 4) };
}

export function createDemoLead(slug: string, input: { name: string; phone: string; whatsapp: string; email: string; message: string }) {
  const property = demoAdminProperties.find((item) => item.slug === slug && item.isPublic && item.status === "disponivel");
  if (!property) return null;
  const lead: Lead = { id: `demo-lead-${Date.now()}`, propertyId: property.id, propertyCode: property.code, propertyTitle: property.title, propertySlug: property.slug, ...input, source: "site", status: "novo", createdAt: new Date().toISOString(), convertedAt: null, convertedClientId: null };
  phase5DemoStore.leads.unshift(lead);
  return lead;
}
