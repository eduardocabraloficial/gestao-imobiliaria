import "server-only";

import { clients as demoClients } from "@/lib/demo-data";
import { calculateFollowUpStatus, clientRowToView, stageLabels } from "@/lib/crm";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Client, DashboardData, FollowUp, Interaction } from "@/types";
import type { ClientRow, FollowUpRow, InteractionRow, ProfileRow } from "@/types/database";
import { getPropertyStats } from "@/lib/data/properties";
import { getScheduleStats } from "@/lib/data/scheduling";
import { getLeadStats } from "@/lib/data/leads";
import { phase5DemoStore } from "@/lib/demo-phase5";
import { phase6DemoStore } from "@/lib/demo-phase6";
import { phase7DemoStore } from "@/lib/demo-phase7";

interface CrmSnapshot {
  clients: Client[];
  interactions: InteractionRow[];
  followUps: FollowUpRow[];
  profileName: string;
  demoMode: boolean;
}

async function getSnapshot(): Promise<CrmSnapshot> {
  if (!isSupabaseConfigured()) {
    const converted = phase5DemoStore.leads.filter((lead) => lead.status === "convertido" && lead.convertedClientId).map((lead) => ({ id: lead.convertedClientId!, name: lead.name, initials: lead.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), phone: lead.phone, whatsapp: lead.whatsapp, email: lead.email, source: "Site", interest: lead.propertyTitle, propertyCode: lead.propertyCode, stage: "Novo lead" as const, lastContact: "Hoje", nextFollowUp: "Não agendado", followUpTime: "—", followUpStatus: "scheduled" as const, responsible: "Marina Costa", budget: "Não informado", neighborhoods: [], bedrooms: 0, note: "Convertido de interesse recebido pelo site." }));
    return {
      clients: [...converted, ...demoClients].map((client) => {
        const stageOverride = phase6DemoStore.stages[client.id];
        const next = phase7DemoStore.nextFollowUps[client.id];
        const completed = phase7DemoStore.completedFollowUps.has(client.id) && !next;
        const stageClient: Client = stageOverride ? { ...client, stage: stageLabels[stageOverride.stage], estimatedValue: stageOverride.estimatedValue, lossReason: stageOverride.lossReason } : client;
        return { ...stageClient, lastInteractionAt: phase7DemoStore.lastInteractionAt[client.id] ?? stageClient.lastInteractionAt, lastContact: phase7DemoStore.lastInteractionAt[client.id] ? new Intl.DateTimeFormat("pt-BR").format(new Date(phase7DemoStore.lastInteractionAt[client.id])) : stageClient.lastContact, followUpId: completed ? undefined : `demo-followup-${client.id}`, ...(next ? { followUpScheduledAt: next, nextFollowUp: new Intl.DateTimeFormat("pt-BR").format(new Date(next)), followUpTime: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(next)), followUpStatus: calculateFollowUpStatus(next) } : {}) };
      }),
      interactions: [],
      followUps: [],
      profileName: "Marina Costa",
      demoMode: true,
    };
  }

  const user = await getCurrentUser();
  if (!user) return { clients: [], interactions: [], followUps: [], profileName: "Corretor", demoMode: false };

  const supabase = await createSupabaseServerClient();
  const [clientsResult, interactionsResult, followUpsResult, profileResult] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("interactions").select("*").order("occurred_at", { ascending: false }),
    supabase.from("follow_ups").select("*").order("scheduled_at", { ascending: true }),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  const error = clientsResult.error ?? interactionsResult.error ?? followUpsResult.error;
  if (error) throw new Error(`Não foi possível carregar os dados do CRM: ${error.message}`);

  const clientRows = (clientsResult.data ?? []) as ClientRow[];
  const interactions = (interactionsResult.data ?? []) as InteractionRow[];
  const followUps = (followUpsResult.data ?? []) as FollowUpRow[];
  const profile = profileResult.data as ProfileRow | null;
  const profileName = profile?.full_name || user.name;

  return {
    clients: clientRows.map((row) => clientRowToView(row, interactions, followUps, profileName)),
    interactions,
    followUps,
    profileName,
    demoMode: false,
  };
}

export async function listClients() {
  const snapshot = await getSnapshot();
  return { clients: snapshot.clients, demoMode: snapshot.demoMode };
}

export async function getClientDetail(id: string): Promise<{
  client: Client | null;
  interactions: Interaction[];
  followUp: FollowUp | null;
  demoMode: boolean;
}> {
  const snapshot = await getSnapshot();
  const client = snapshot.clients.find((item) => item.id === id) ?? null;
  if (!client) return { client: null, interactions: [], followUp: null, demoMode: snapshot.demoMode };

  if (snapshot.demoMode) {
    const demoFollowUp = client.followUpId && client.followUpScheduledAt ? { id: client.followUpId, scheduledAt: client.followUpScheduledAt, notes: "Retorno demonstrativo", status: "pendente" as const, completedAt: null } : null;
    return { client, interactions: phase7DemoStore.interactions[id] ?? [], followUp: demoFollowUp, demoMode: true };
  }

  const interactions = snapshot.interactions
    .filter((item) => item.client_id === id)
    .map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      occurredAt: item.occurred_at,
      responsible: snapshot.profileName,
    }));
  const followUpRow = snapshot.followUps.find((item) => item.client_id === id && item.status === "pendente");
  const followUp = followUpRow
    ? { id: followUpRow.id, scheduledAt: followUpRow.scheduled_at, notes: followUpRow.notes ?? "", status: followUpRow.status, completedAt: followUpRow.completed_at }
    : null;

  return { client, interactions, followUp, demoMode: false };
}

export async function getDashboardData(): Promise<DashboardData> {
  const snapshot = await getSnapshot();
  const [propertyStats, scheduleStats, leadStats] = await Promise.all([getPropertyStats(), getScheduleStats(), getLeadStats()]);
  const active = snapshot.clients.filter((client) => !["Concluído", "Perdido"].includes(client.stage));
  const withPendingFollowUp = snapshot.clients.filter((client) => Boolean(client.followUpId) || snapshot.demoMode);
  const ordered = [...withPendingFollowUp].sort((a, b) => {
    const rank = { overdue: 0, today: 1, scheduled: 2 };
    const statusDiff = rank[a.followUpStatus] - rank[b.followUpStatus];
    if (statusDiff !== 0) return statusDiff;
    return (a.followUpScheduledAt ?? a.nextFollowUp).localeCompare(b.followUpScheduledAt ?? b.nextFollowUp);
  });

  return {
    profileName: snapshot.profileName,
    clientsActive: active.length,
    followUpsToday: ordered.filter((client) => client.followUpStatus === "today").length,
    followUpsOverdue: ordered.filter((client) => client.followUpStatus === "overdue").length,
    newLeads: leadStats.newCount,
    recentLeads: leadStats.recent,
    negotiatingClients: snapshot.clients.filter((client) => client.stage === "Negociação").length,
    closedThisMonth: snapshot.clients.filter((client) => {
      if (client.stage !== "Concluído" || !client.updatedAt) return false;
      const updatedAt = new Date(client.updatedAt);
      const now = new Date();
      return updatedAt.getMonth() === now.getMonth() && updatedAt.getFullYear() === now.getFullYear();
    }).length,
    clients: ordered,
    demoMode: snapshot.demoMode,
    propertiesAvailable: propertyStats.available,
    propertiesReserved: propertyStats.reserved,
    propertiesClosed: propertyStats.closed,
    visitsToday: scheduleStats.visitsToday,
    upcomingVisits: scheduleStats.upcomingVisits,
    overdueTasks: scheduleStats.overdueTasks,
  };
}
