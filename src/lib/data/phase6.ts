import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { listClients } from "@/lib/data/crm";
import { listLeads } from "@/lib/data/leads";
import { listAdminProperties } from "@/lib/data/properties";
import { getSchedulingData } from "@/lib/data/scheduling";
import { phase6DemoStore } from "@/lib/demo-phase6";
import { conversionRate, funnelStages, inPeriod, periodBounds, type PeriodPreset } from "@/lib/phase6";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { stageLabels } from "@/lib/crm";
import type { OrganizationSettings, StageHistory } from "@/types";
import type { ClientStageHistoryRow, FollowUpRow, InteractionRow, OrganizationSettingsRow } from "@/types/database";
import { demoInterestLinks } from "@/lib/demo-properties";

export async function getStageHistory(clientId: string): Promise<StageHistory[]> {
  if (!isSupabaseConfigured()) return phase6DemoStore.history[clientId] ?? [];
  const user = await getCurrentUser(); if (!user) return [];
  const supabase = await createSupabaseServerClient(); const { data } = await supabase.from("client_stage_history").select("*").eq("client_id", clientId).eq("user_id", user.id).order("changed_at", { ascending: false });
  return ((data ?? []) as ClientStageHistoryRow[]).map((row) => ({ id: row.id, previousStage: stageLabels[row.previous_stage], newStage: stageLabels[row.new_stage], changedAt: row.changed_at }));
}

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  if (!isSupabaseConfigured()) return phase6DemoStore.settings;
  const user = await getCurrentUser(); if (!user) return phase6DemoStore.settings;
  const supabase = await createSupabaseServerClient(); const { data } = await supabase.from("organization_settings").select("*").eq("user_id", user.id).maybeSingle();
  return settingsView(data as OrganizationSettingsRow | null);
}
function settingsView(row: OrganizationSettingsRow | null): OrganizationSettings { return row ? { id: row.id, businessName: row.business_name ?? "", tradeName: row.trade_name ?? "", creci: row.creci ?? "", phone: row.phone ?? "", whatsapp: row.whatsapp ?? "", email: row.email ?? "", address: row.address ?? "", instagram: row.instagram ?? "", website: row.website ?? "", description: row.description ?? "", logoPath: row.logo_path ?? "", primaryColor: row.primary_color ?? "#111111", secondaryColor: row.secondary_color ?? "#D6A34D", heroTitle: row.hero_title ?? "", heroSubtitle: row.hero_subtitle ?? "", footerText: row.footer_text ?? "" } : { ...phase6DemoStore.settings, id: "" }; }

export async function getGlobalSearchData() {
  const [{ clients }, { properties }] = await Promise.all([listClients(), listAdminProperties()]);
  return [...clients.map((client) => ({ id: client.id, type: "Cliente", title: client.name, detail: `${client.phone} · ${client.email}`, href: `/admin/clientes/${client.id}`, search: `${client.name} ${client.phone} ${client.email}` })), ...properties.map((property) => ({ id: property.id, type: "Imóvel", title: property.title, detail: `${property.code} · ${property.neighborhood}`, href: `/admin/imoveis/${property.id}`, search: `${property.title} ${property.code} ${property.neighborhood}` }))];
}

export async function getReportData(preset: PeriodPreset, from?: string, to?: string) {
  const { start, end } = periodBounds(preset, new Date(), from, to);
  const [{ clients }, { leads }, { properties }, schedule] = await Promise.all([listClients(), listLeads(), listAdminProperties(), getSchedulingData()]);
  let interactions: InteractionRow[] = [], followUps: FollowUpRow[] = [], interestPropertyIds = demoInterestLinks.map((item) => item.propertyId);
  if (isSupabaseConfigured()) { const user = await getCurrentUser(); if (user) { const supabase = await createSupabaseServerClient(); const [i, f, interests] = await Promise.all([supabase.from("interactions").select("*").eq("user_id", user.id), supabase.from("follow_ups").select("*").eq("user_id", user.id), supabase.from("client_property_interests").select("property_id").eq("user_id", user.id)]); interactions = (i.data ?? []) as InteractionRow[]; followUps = (f.data ?? []) as FollowUpRow[]; interestPropertyIds = (interests.data ?? []).map((item) => String(item.property_id)); } }
  const periodClients = clients.filter((item) => inPeriod(item.createdAt, start, end)); const periodLeads = leads.filter((item) => inPeriod(item.createdAt, start, end));
  const periodInteractions = interactions.filter((item) => inPeriod(item.occurred_at, start, end)); const periodVisits = schedule.appointments.filter((item) => inPeriod(item.scheduledAt, start, end));
  const stageDistribution = funnelStages.map((stage) => ({ label: stage.label, value: clients.filter((client) => client.stage === stage.label).length }));
  const validLeads = periodLeads.filter((lead) => lead.status !== "descartado"); const converted = validLeads.filter((lead) => lead.status === "convertido").length;
  const ranking = (ids: string[]) => properties.map((property) => ({ label: property.code, value: ids.filter((id) => id === property.id).length })).sort((a,b) => b.value-a.value).filter((item) => item.value > 0).slice(0,5);
  return { period: { start: start.toISOString(), end: end.toISOString() }, clients: { total: clients.length, new: periodClients.length, active: clients.filter((c) => !["Concluído", "Perdido"].includes(c.stage)).length, closed: clients.filter((c) => c.stage === "Concluído").length, lost: clients.filter((c) => c.stage === "Perdido").length, stages: stageDistribution, conversion: conversionRate(clients.filter((c) => c.stage === "Concluído").length, clients.length) }, leads: { total: periodLeads.length, new: periodLeads.filter((l) => l.status === "novo").length, attending: periodLeads.filter((l) => l.status === "em_atendimento").length, converted, discarded: periodLeads.filter((l) => l.status === "descartado").length, conversion: conversionRate(converted, validLeads.length) }, interactions: { total: periodInteractions.length, byType: ["ligacao","whatsapp","email","reuniao","visita"].map((type) => ({ label: type, value: periodInteractions.filter((i) => i.type === type).length })) }, followUps: { scheduled: followUps.filter((f) => inPeriod(f.scheduled_at, start, end)).length, completed: followUps.filter((f) => f.status === "concluido" && inPeriod(f.completed_at, start, end)).length, overdue: followUps.filter((f) => f.status === "pendente" && new Date(f.scheduled_at) < new Date()).length, onTime: followUps.filter((f) => f.status === "concluido" && f.completed_at && new Date(f.completed_at) <= new Date(f.scheduled_at)).length }, visits: { total: periodVisits.length, scheduled: periodVisits.filter((v) => ["agendada","reagendada"].includes(v.status)).length, completed: periodVisits.filter((v) => v.status === "realizada").length, canceled: periodVisits.filter((v) => v.status === "cancelada").length, rescheduled: periodVisits.filter((v) => v.status === "reagendada").length }, properties: { available: properties.filter((p) => p.status === "disponivel").length, reserved: properties.filter((p) => p.status === "reservado").length, sold: properties.filter((p) => p.status === "vendido").length, rented: properties.filter((p) => p.status === "alugado").length, inactive: properties.filter((p) => p.status === "inativo").length, topInterested: ranking(interestPropertyIds), topVisited: ranking(schedule.appointments.map((item) => item.propertyId)) } };
}

export async function getExportRows(dataset: string) {
  if (!await getCurrentUser()) return null;
  if (dataset === "clientes") { const { clients } = await listClients(); return { headers: ["Nome","Telefone","E-mail","Etapa","Valor estimado"], rows: clients.map((c) => [c.name,c.phone,c.email,c.stage,c.estimatedValue ?? ""]) }; }
  if (dataset === "leads") { const { leads } = await listLeads(); return { headers: ["Nome","Telefone","E-mail","Imóvel","Status","Data"], rows: leads.map((l) => [l.name,l.phone,l.email,l.propertyCode,l.status,l.createdAt]) }; }
  if (dataset === "imoveis") { const { properties } = await listAdminProperties(); return { headers: ["Código","Título","Finalidade","Preço","Status"], rows: properties.map((p) => [p.code,p.title,p.purpose,p.price,p.status]) }; }
  const schedule = await getSchedulingData();
  if (dataset === "visitas") return { headers: ["Cliente","Imóvel","Data","Duração","Status"], rows: schedule.appointments.map((a) => [a.clientName,a.propertyCode,a.scheduledAt,a.durationMinutes,a.status]) };
  if (dataset === "pendencias") return { headers: ["Título","Cliente","Imóvel","Vencimento","Prioridade","Status"], rows: schedule.tasks.map((t) => [t.title,t.clientName,t.propertyCode,t.dueAt,t.priority,t.status]) };
  return null;
}
