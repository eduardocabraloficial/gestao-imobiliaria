import type { Client } from "@/types";

export const INACTIVE_CLIENT_DAYS = 7;

function parseBrazilianDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysSinceContact(value: string | undefined, now = new Date()) {
  if (!value || value === "Sem contato") return null;
  const parsed = parseBrazilianDate(value) ?? new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const dayMs = 86_400_000;
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / dayMs));
}

export function inactiveClients(clients: Client[], now = new Date(), threshold = INACTIVE_CLIENT_DAYS) {
  return clients.flatMap((client) => {
    if (["Concluído", "Perdido"].includes(client.stage)) return [];
    const days = daysSinceContact(client.lastInteractionAt ?? client.lastContact, now);
    return days !== null && days >= threshold ? [{ ...client, daysWithoutContact: days }] : [];
  }).sort((a, b) => b.daysWithoutContact - a.daysWithoutContact);
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return { items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize), currentPage, totalPages, total: items.length };
}

export function nextSearchIndex(current: number, length: number, direction: 1 | -1) {
  if (length === 0) return -1;
  return (current + direction + length) % length;
}

export function clientFilterQuery(query: string, status: string, page: number) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  return params.toString();
}

export function validateQuickInteraction(input: { clientId: string; description: string; occurredAt: string; nextFollowUpAt?: string }) {
  if (!input.clientId) return "Selecione um cliente.";
  if (input.description.trim().length < 2) return "Descreva o atendimento realizado.";
  if (!input.occurredAt || Number.isNaN(new Date(input.occurredAt).getTime())) return "Informe uma data e horário válidos.";
  if (input.nextFollowUpAt && Number.isNaN(new Date(input.nextFollowUpAt).getTime())) return "Informe um próximo retorno válido.";
  return null;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDateTimePtBr(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function formatBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return value;
}
