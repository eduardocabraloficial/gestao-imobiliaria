import type { Client, ClientStage } from "@/types";
import type { ClientRow, ClientStageCode, FollowUpRow, InteractionRow } from "@/types/database";

export const stageLabels: Record<ClientStageCode, ClientStage> = {
  novo_lead: "Novo lead",
  primeiro_contato: "Primeiro contato",
  qualificacao: "Qualificação",
  imoveis_enviados: "Imóveis enviados",
  visita_agendada: "Visita agendada",
  visita_realizada: "Visita realizada",
  negociacao: "Negociação",
  proposta: "Proposta",
  documentacao: "Documentação",
  concluido: "Concluído",
  perdido: "Perdido",
};

export const stageCodes = Object.fromEntries(
  Object.entries(stageLabels).map(([code, label]) => [label, code]),
) as Record<ClientStage, ClientStageCode>;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Cayenne" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Cayenne" });
const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cayenne" });

export function calculateFollowUpStatus(scheduledAt: string, now = new Date()): Client["followUpStatus"] {
  const scheduled = new Date(scheduledAt);
  const scheduledDay = dateKeyFormatter.format(scheduled);
  const today = dateKeyFormatter.format(now);
  if (scheduledDay === today) return "today";
  return scheduled < now ? "overdue" : "scheduled";
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function priceRange(min: number | null, max: number | null) {
  const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (min !== null && max !== null) return `${currency.format(min)} — ${currency.format(max)}`;
  if (max !== null) return `Até ${currency.format(max)}`;
  if (min !== null) return `A partir de ${currency.format(min)}`;
  return "A definir";
}

export function clientRowToView(
  row: ClientRow,
  interactions: InteractionRow[],
  followUps: FollowUpRow[],
  responsible: string,
): Client {
  const lastInteraction = interactions
    .filter((item) => item.client_id === row.id)
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))[0];
  const pendingFollowUp = followUps
    .filter((item) => item.client_id === row.id && item.status === "pendente")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];

  return {
    id: row.id,
    name: row.name,
    initials: initials(row.name),
    phone: row.phone,
    whatsapp: row.whatsapp ?? row.phone,
    email: row.email ?? "",
    source: row.source,
    interest: row.property_type || "Busca personalizada",
    stage: stageLabels[row.stage],
    lastContact: lastInteraction ? dateFormatter.format(new Date(lastInteraction.occurred_at)) : "Sem contato",
    lastInteractionAt: lastInteraction?.occurred_at,
    nextFollowUp: pendingFollowUp ? dateFormatter.format(new Date(pendingFollowUp.scheduled_at)) : "A definir",
    followUpTime: pendingFollowUp ? timeFormatter.format(new Date(pendingFollowUp.scheduled_at)) : "—",
    followUpStatus: pendingFollowUp ? calculateFollowUpStatus(pendingFollowUp.scheduled_at) : "scheduled",
    responsible,
    budget: priceRange(row.min_price, row.max_price),
    neighborhoods: row.neighborhoods,
    bedrooms: row.bedrooms ?? 0,
    note: row.notes ?? "",
    purpose: row.purpose ?? "",
    propertyType: row.property_type ?? "",
    minPrice: row.min_price,
    maxPrice: row.max_price,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    followUpId: pendingFollowUp?.id,
    followUpScheduledAt: pendingFollowUp?.scheduled_at,
    estimatedValue: row.estimated_value === null ? null : Number(row.estimated_value),
    lossReason: row.loss_reason ?? "",
  };
}
