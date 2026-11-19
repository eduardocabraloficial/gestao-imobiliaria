"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { stageCodes, stageLabels } from "@/lib/crm";
import { validateStageMove } from "@/lib/phase6";
import { validateQuickInteraction } from "@/lib/phase7";
import { phase7DemoStore } from "@/lib/demo-phase7";
import { phase6DemoStore } from "@/lib/demo-phase6";
import { clients as demoClients } from "@/lib/demo-data";
import type { ClientStageCode } from "@/types/database";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ClientInput, ClientStage } from "@/types";
import type { InteractionType } from "@/types/database";

export type ActionResult = { success: boolean; message: string; demo?: boolean; id?: string };
export type QuickInteractionInput = {
  clientId: string;
  type: InteractionType;
  description: string;
  occurredAt: string;
  completeCurrentFollowUp: boolean;
  nextFollowUpAt: string;
};

function validateClient(input: ClientInput): string | null {
  if (input.name.trim().length < 2) return "Informe o nome completo do cliente.";
  if (input.phone.trim().length < 8) return "Informe um telefone válido.";
  if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) return "Informe um e-mail válido.";
  if (input.minPrice !== null && input.maxPrice !== null && input.minPrice > input.maxPrice) return "O preço mínimo não pode ser maior que o máximo.";
  return null;
}

async function authenticatedContext() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user, supabase: await createSupabaseServerClient() };
}

export async function createClientAction(input: ClientInput): Promise<ActionResult> {
  const validation = validateClient(input);
  if (validation) return { success: false, message: validation };
  if (!isSupabaseConfigured()) return { success: true, message: "Cliente cadastrado com sucesso.", demo: true };

  const context = await authenticatedContext();
  if (!context) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { data, error } = await context.supabase.from("clients").insert({
    user_id: context.user.id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    whatsapp: input.whatsapp.trim() || input.phone.trim(),
    email: input.email.trim() || null,
    source: input.source,
    purpose: input.purpose || null,
    property_type: input.propertyType || null,
    neighborhoods: input.neighborhoods,
    min_price: input.minPrice,
    max_price: input.maxPrice,
    bedrooms: input.bedrooms,
    notes: input.notes.trim() || null,
    stage: "novo_lead",
    estimated_value: input.estimatedValue ?? null,
  }).select("id").single();

  if (error) return { success: false, message: "Não foi possível salvar o cliente." };
  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  return { success: true, message: "Cliente cadastrado com sucesso.", id: data.id };
}

export async function updateClientAction(clientId: string, input: ClientInput): Promise<ActionResult> {
  const validation = validateClient(input);
  if (validation) return { success: false, message: validation };
  if (!isSupabaseConfigured()) return { success: true, message: "Cliente atualizado com sucesso.", demo: true };
  const context = await authenticatedContext();
  if (!context) return { success: false, message: "Sua sessão expirou. Entre novamente." };

  const { error } = await context.supabase.from("clients").update({
    name: input.name.trim(), phone: input.phone.trim(), whatsapp: input.whatsapp.trim() || input.phone.trim(),
    email: input.email.trim() || null, source: input.source, purpose: input.purpose || null,
    property_type: input.propertyType || null, neighborhoods: input.neighborhoods,
    min_price: input.minPrice, max_price: input.maxPrice, bedrooms: input.bedrooms,
    notes: input.notes.trim() || null,
    ...(input.estimatedValue !== undefined ? { estimated_value: input.estimatedValue } : {}),
  }).eq("id", clientId).eq("user_id", context.user.id);
  if (error) return { success: false, message: "Não foi possível salvar o cliente." };
  revalidatePath("/admin"); revalidatePath("/admin/clientes"); revalidatePath(`/admin/clientes/${clientId}`);
  return { success: true, message: "Cliente atualizado com sucesso." };
}

export async function updateClientStageAction(clientId: string, stage: ClientStage): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true, message: "Etapa atualizada.", demo: true };
  const context = await authenticatedContext();
  if (!context) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await context.supabase.from("clients").update({ stage: stageCodes[stage] }).eq("id", clientId).eq("user_id", context.user.id);
  if (error) return { success: false, message: "Não foi possível atualizar a etapa." };
  revalidatePath("/admin"); revalidatePath("/admin/clientes"); revalidatePath(`/admin/clientes/${clientId}`);
  return { success: true, message: "Etapa atualizada." };
}

export async function moveClientStageAction(clientId: string, stage: ClientStageCode, lossReason = "", estimatedValue: number | null = null): Promise<ActionResult> {
  const validation = validateStageMove(stage, lossReason); if (validation) return { success: false, message: validation };
  if (estimatedValue !== null && (!Number.isFinite(estimatedValue) || estimatedValue < 0)) return { success: false, message: "Valor estimado inválido." };
  if (!isSupabaseConfigured()) {
    const current = phase6DemoStore.stages[clientId]?.stage ?? stageCodes[demoClients.find((client) => client.id === clientId)?.stage ?? "Novo lead"];
    phase6DemoStore.stages[clientId] = { stage, estimatedValue, lossReason: stage === "perdido" ? lossReason.trim() : "" };
    phase6DemoStore.history[clientId] ??= []; phase6DemoStore.history[clientId].unshift({ id: `demo-history-${Date.now()}`, previousStage: stageLabels[current], newStage: stageLabels[stage], changedAt: new Date().toISOString() });
    return { success: true, message: "Etapa atualizada.", demo: true };
  }
  const context = await authenticatedContext(); if (!context) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await context.supabase.from("clients").update({ stage, estimated_value: estimatedValue, loss_reason: stage === "perdido" ? lossReason.trim() : null }).eq("id", clientId).eq("user_id", context.user.id);
  if (error) return { success: false, message: "Não foi possível atualizar a etapa." };
  revalidatePath("/admin"); revalidatePath("/admin/funil"); revalidatePath("/admin/relatorios"); revalidatePath(`/admin/clientes/${clientId}`);
  return { success: true, message: "Etapa atualizada." };
}

export async function addInteractionAction(clientId: string, type: InteractionType, description: string): Promise<ActionResult> {
  if (description.trim().length < 2) return { success: false, message: "Descreva o atendimento realizado." };
  if (!isSupabaseConfigured()) return { success: true, message: "Atendimento registrado com sucesso.", demo: true };
  const context = await authenticatedContext();
  if (!context) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { data: ownedClient } = await context.supabase.from("clients").select("id").eq("id", clientId).eq("user_id", context.user.id).maybeSingle();
  if (!ownedClient) return { success: false, message: "Cliente não encontrado." };
  const { error } = await context.supabase.from("interactions").insert({ client_id: clientId, user_id: context.user.id, type, description: description.trim(), occurred_at: new Date().toISOString() });
  if (error) return { success: false, message: "Não foi possível registrar o atendimento." };
  revalidatePath("/admin"); revalidatePath(`/admin/clientes/${clientId}`);
  return { success: true, message: "Atendimento registrado com sucesso." };
}

export async function createQuickInteractionAction(input: QuickInteractionInput): Promise<ActionResult> {
  const validation = validateQuickInteraction(input);
  if (validation) return { success: false, message: validation };
  const occurredAt = new Date(input.occurredAt);
  const nextFollowUp = input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null;
  if (!isSupabaseConfigured()) {
    phase7DemoStore.lastInteractionAt[input.clientId] = occurredAt.toISOString();
    phase7DemoStore.interactions[input.clientId] ??= [];
    phase7DemoStore.interactions[input.clientId].unshift({ id: `demo-interaction-${Date.now()}`, type: input.type, description: input.description.trim(), occurredAt: occurredAt.toISOString(), responsible: "Marina Costa" });
    if (input.completeCurrentFollowUp) phase7DemoStore.completedFollowUps.add(input.clientId);
    if (nextFollowUp) { phase7DemoStore.nextFollowUps[input.clientId] = nextFollowUp.toISOString(); phase7DemoStore.completedFollowUps.delete(input.clientId); }
    revalidatePath("/admin"); revalidatePath("/admin/hoje"); revalidatePath(`/admin/clientes/${input.clientId}`);
    return { success: true, message: "Atendimento registrado com sucesso.", demo: true };
  }

  const context = await authenticatedContext();
  if (!context) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { data: ownedClient } = await context.supabase.from("clients").select("id").eq("id", input.clientId).eq("user_id", context.user.id).maybeSingle();
  if (!ownedClient) return { success: false, message: "Cliente não encontrado." };

  const { error: interactionError } = await context.supabase.from("interactions").insert({
    client_id: input.clientId,
    user_id: context.user.id,
    type: input.type,
    description: input.description.trim(),
    occurred_at: occurredAt.toISOString(),
  });
  if (interactionError) return { success: false, message: "Não foi possível registrar o atendimento." };

  if (input.completeCurrentFollowUp) {
    const { error } = await context.supabase.from("follow_ups").update({ status: "concluido", completed_at: occurredAt.toISOString() }).eq("client_id", input.clientId).eq("user_id", context.user.id).eq("status", "pendente");
    if (error) return { success: false, message: "Atendimento salvo, mas não foi possível concluir o retorno atual." };
  }
  if (nextFollowUp) {
    const { error } = await context.supabase.from("follow_ups").insert({ client_id: input.clientId, user_id: context.user.id, scheduled_at: nextFollowUp.toISOString(), notes: "Próximo retorno definido no registro rápido.", status: "pendente" });
    if (error) return { success: false, message: "Atendimento salvo, mas não foi possível criar o próximo retorno." };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/hoje");
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${input.clientId}`);
  return { success: true, message: "Atendimento registrado com sucesso." };
}

export async function saveFollowUpAction(clientId: string, scheduledAt: string, notes: string): Promise<ActionResult> {
  const scheduled = new Date(scheduledAt);
  if (!scheduledAt || Number.isNaN(scheduled.getTime())) return { success: false, message: "Informe uma data e horário válidos." };
  if (!isSupabaseConfigured()) return { success: true, message: "Próximo retorno atualizado.", demo: true };
  const context = await authenticatedContext();
  if (!context) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { data: ownedClient } = await context.supabase.from("clients").select("id").eq("id", clientId).eq("user_id", context.user.id).maybeSingle();
  if (!ownedClient) return { success: false, message: "Cliente não encontrado." };
  const { error: cancelError } = await context.supabase.from("follow_ups").update({ status: "cancelado" }).eq("client_id", clientId).eq("user_id", context.user.id).eq("status", "pendente");
  if (cancelError) return { success: false, message: "Não foi possível atualizar o retorno." };
  const { error } = await context.supabase.from("follow_ups").insert({ client_id: clientId, user_id: context.user.id, scheduled_at: scheduled.toISOString(), notes: notes.trim() || null, status: "pendente" });
  if (error) return { success: false, message: "Não foi possível atualizar o retorno." };
  revalidatePath("/admin"); revalidatePath("/admin/clientes"); revalidatePath(`/admin/clientes/${clientId}`);
  return { success: true, message: "Próximo retorno atualizado." };
}

export async function completeFollowUpAction(clientId: string, followUpId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true, message: "Retorno concluído.", demo: true };
  const context = await authenticatedContext();
  if (!context) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await context.supabase.from("follow_ups").update({ status: "concluido", completed_at: new Date().toISOString() }).eq("id", followUpId).eq("client_id", clientId).eq("user_id", context.user.id).eq("status", "pendente");
  if (error) return { success: false, message: "Não foi possível concluir o retorno." };
  revalidatePath("/admin"); revalidatePath("/admin/clientes"); revalidatePath(`/admin/clientes/${clientId}`);
  return { success: true, message: "Retorno concluído." };
}
