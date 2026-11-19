import type { Client, ClientStage } from "@/types";
import type { ClientStageCode } from "@/types/database";

export const funnelStages: { code: ClientStageCode; label: ClientStage }[] = [
  ["novo_lead", "Novo lead"], ["primeiro_contato", "Primeiro contato"], ["qualificacao", "Qualificação"],
  ["imoveis_enviados", "Imóveis enviados"], ["visita_agendada", "Visita agendada"], ["visita_realizada", "Visita realizada"],
  ["negociacao", "Negociação"], ["proposta", "Proposta"], ["documentacao", "Documentação"], ["concluido", "Concluído"], ["perdido", "Perdido"],
].map(([code, label]) => ({ code: code as ClientStageCode, label: label as ClientStage }));

export type PeriodPreset = "today" | "7d" | "30d" | "month" | "custom";
function parseDateInput(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}
export function periodBounds(preset: PeriodPreset, now = new Date(), customFrom?: string, customTo?: string) {
  const customEnd = preset === "custom" ? parseDateInput(customTo, true) : null;
  const end = customEnd ?? new Date(now);
  const start = new Date(end);
  if (preset === "today") start.setHours(0, 0, 0, 0);
  else if (preset === "7d") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "30d") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  else {
    const customStart = parseDateInput(customFrom);
    if (customStart) start.setTime(customStart.getTime());
  }
  if (start > end) start.setTime(end.getTime());
  return { start, end };
}

export function inPeriod(value: string | null | undefined, start: Date, end: Date) {
  if (!value) return false; const date = new Date(value); return !Number.isNaN(date.getTime()) && date >= start && date <= end;
}
export function conversionRate(converted: number, totalValid: number) { return totalValid > 0 ? Math.round((converted / totalValid) * 1000) / 10 : 0; }
export function sanitizeCsvCell(value: unknown) { const text = String(value ?? "").replaceAll('"', '""'); return `"${/^[=+\-@]/.test(text) ? `'${text}` : text}"`; }
export function toCsv(headers: string[], rows: unknown[][]) { return `\uFEFF${headers.map(sanitizeCsvCell).join(",")}\r\n${rows.map((row) => row.map(sanitizeCsvCell).join(",")).join("\r\n")}`; }
export function matchesGlobalSearch(query: string, values: Array<string | undefined | null>) { const term = query.trim().toLocaleLowerCase("pt-BR"); return term.length >= 2 && values.some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(term)); }
export function validateStageMove(stage: ClientStageCode, lossReason: string) { if (!funnelStages.some((item) => item.code === stage)) return "Etapa inválida."; if (stage === "perdido" && lossReason.trim().length < 2) return "Informe o motivo da perda."; return null; }
export function stageHistoryEntry(previous: ClientStageCode, next: ClientStageCode, changedAt = new Date().toISOString()) { return { previousStage: previous, newStage: next, changedAt }; }
export function groupClientsByStage(clients: Client[]) { return Object.fromEntries(funnelStages.map((stage) => [stage.label, clients.filter((client) => client.stage === stage.label)])) as Record<ClientStage, Client[]>; }
