"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { TaskInput } from "@/types";
import type { TaskStatus } from "@/types/database";
import type { ScheduleActionResult } from "@/app/admin/agenda/actions";

async function context() { const user = await getCurrentUser(); return user ? { user, supabase: await createSupabaseServerClient() } : null; }
function refresh(clientId?: string | null, propertyId?: string | null) { revalidatePath("/admin"); revalidatePath("/admin/pendencias"); if (clientId) revalidatePath(`/admin/clientes/${clientId}`); if (propertyId) revalidatePath(`/admin/imoveis/${propertyId}`); }
function validate(input: TaskInput) { if (input.title.trim().length < 3 || input.title.trim().length > 160) return "Informe um título entre 3 e 160 caracteres."; if (input.description.length > 2000) return "A descrição deve ter até 2.000 caracteres."; if (!input.dueAt || Number.isNaN(new Date(input.dueAt).getTime())) return "Informe um vencimento válido."; if (!["baixa", "media", "alta"].includes(input.priority)) return "Prioridade inválida."; return null; }

export async function createTaskAction(input: TaskInput): Promise<ScheduleActionResult> {
  const errorMessage = validate(input); if (errorMessage) return { success: false, message: errorMessage };
  if (!isSupabaseConfigured()) return { success: true, message: "Pendência criada com sucesso.", demo: true, id: `demo-task-${Date.now()}` };
  const current = await context(); if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  if (input.clientId) { const { data } = await current.supabase.from("clients").select("id").eq("id", input.clientId).eq("user_id", current.user.id).maybeSingle(); if (!data) return { success: false, message: "Cliente não encontrado." }; }
  if (input.propertyId) { const { data } = await current.supabase.from("properties").select("id").eq("id", input.propertyId).eq("user_id", current.user.id).maybeSingle(); if (!data) return { success: false, message: "Imóvel não encontrado." }; }
  const { data, error } = await current.supabase.from("tasks").insert({ user_id: current.user.id, client_id: input.clientId, property_id: input.propertyId, title: input.title.trim(), description: input.description.trim() || null, due_at: new Date(input.dueAt).toISOString(), priority: input.priority, status: "pendente" }).select("id").single();
  if (error) return { success: false, message: "Não foi possível salvar as alterações." };
  refresh(input.clientId, input.propertyId); return { success: true, message: "Pendência criada com sucesso.", id: data.id };
}

export async function updateTaskAction(id: string, input: TaskInput): Promise<ScheduleActionResult> {
  const errorMessage = validate(input); if (errorMessage) return { success: false, message: errorMessage };
  if (!isSupabaseConfigured()) return { success: true, message: "Pendência atualizada com sucesso.", demo: true };
  const current = await context(); if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await current.supabase.from("tasks").update({ client_id: input.clientId, property_id: input.propertyId, title: input.title.trim(), description: input.description.trim() || null, due_at: new Date(input.dueAt).toISOString(), priority: input.priority }).eq("id", id).eq("user_id", current.user.id);
  if (error) return { success: false, message: "Não foi possível salvar as alterações." };
  refresh(input.clientId, input.propertyId); return { success: true, message: "Pendência atualizada com sucesso." };
}

export async function updateTaskStatusAction(id: string, status: TaskStatus, clientId?: string | null, propertyId?: string | null): Promise<ScheduleActionResult> {
  if (!["pendente", "concluida", "cancelada"].includes(status)) return { success: false, message: "Situação inválida." };
  if (!isSupabaseConfigured()) return { success: true, message: status === "concluida" ? "Pendência concluída." : "Pendência atualizada.", demo: true };
  const current = await context(); if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await current.supabase.from("tasks").update({ status, completed_at: status === "concluida" ? new Date().toISOString() : null }).eq("id", id).eq("user_id", current.user.id);
  if (error) return { success: false, message: "Não foi possível salvar as alterações." };
  refresh(clientId, propertyId); return { success: true, message: status === "concluida" ? "Pendência concluída." : "Pendência atualizada." };
}
