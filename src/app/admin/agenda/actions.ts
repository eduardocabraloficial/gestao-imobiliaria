"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { AppointmentInput } from "@/types";
import type { AppointmentStatus } from "@/types/database";
import { hasAppointmentConflict } from "@/lib/scheduling";

export type ScheduleActionResult = { success: boolean; message: string; warning?: string; demo?: boolean; id?: string };

async function context() { const user = await getCurrentUser(); return user ? { user, supabase: await createSupabaseServerClient() } : null; }
function refresh(clientId?: string, propertyId?: string) { revalidatePath("/admin"); revalidatePath("/admin/agenda"); if (clientId) revalidatePath(`/admin/clientes/${clientId}`); if (propertyId) revalidatePath(`/admin/imoveis/${propertyId}`); }

export async function createAppointmentAction(input: AppointmentInput): Promise<ScheduleActionResult> {
  const scheduled = new Date(input.scheduledAt);
  if (!input.clientId || !input.propertyId) return { success: false, message: "Selecione o cliente e o imóvel." };
  if (!input.scheduledAt || Number.isNaN(scheduled.getTime())) return { success: false, message: "Informe uma data e horário válidos." };
  if (scheduled < new Date()) return { success: false, message: "A visita deve ser agendada para uma data futura." };
  if (input.durationMinutes < 15 || input.durationMinutes > 480) return { success: false, message: "A duração deve ficar entre 15 e 480 minutos." };
  if (input.notes.length > 2000) return { success: false, message: "As observações devem ter até 2.000 caracteres." };
  if (!isSupabaseConfigured()) return { success: true, message: "Visita agendada com sucesso.", demo: true, id: `demo-appointment-${Date.now()}` };
  const current = await context(); if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const [clientResult, propertyResult] = await Promise.all([current.supabase.from("clients").select("id").eq("id", input.clientId).eq("user_id", current.user.id).maybeSingle(), current.supabase.from("properties").select("id").eq("id", input.propertyId).eq("user_id", current.user.id).maybeSingle()]);
  if (!clientResult.data || !propertyResult.data) return { success: false, message: "Cliente ou imóvel não encontrado." };
  const start = new Date(scheduled.getTime() - 8 * 60 * 60000).toISOString();
  const end = new Date(scheduled.getTime() + 8 * 60 * 60000).toISOString();
  const { data: nearby } = await current.supabase.from("appointments").select("scheduled_at,duration_minutes,status").eq("user_id", current.user.id).in("status", ["agendada", "reagendada"]).gte("scheduled_at", start).lte("scheduled_at", end);
  const conflict = hasAppointmentConflict(input.scheduledAt, input.durationMinutes, (nearby ?? []).map((item) => ({ scheduledAt: item.scheduled_at, durationMinutes: item.duration_minutes, status: item.status })));
  const { data, error } = await current.supabase.from("appointments").insert({ user_id: current.user.id, client_id: input.clientId, property_id: input.propertyId, scheduled_at: scheduled.toISOString(), duration_minutes: input.durationMinutes, notes: input.notes.trim() || null, status: "agendada" }).select("id").single();
  if (error) return { success: false, message: "Não foi possível salvar a visita." };
  refresh(input.clientId, input.propertyId);
  return { success: true, message: "Visita agendada com sucesso.", warning: conflict ? "Atenção: existe outra visita em conflito com este horário." : undefined, id: data.id };
}

export async function updateAppointmentAction(id: string, status: AppointmentStatus, scheduledAt?: string): Promise<ScheduleActionResult> {
  if (!["agendada", "realizada", "cancelada", "reagendada"].includes(status)) return { success: false, message: "Situação inválida." };
  if (!isSupabaseConfigured()) return { success: true, message: "Visita atualizada com sucesso.", demo: true };
  const current = await context(); if (!current) return { success: false, message: "Sua sessão expirou. Entre novamente." };
  const patch: { status: AppointmentStatus; scheduled_at?: string } = { status };
  if (scheduledAt) { const date = new Date(scheduledAt); if (Number.isNaN(date.getTime())) return { success: false, message: "Informe uma nova data válida." }; patch.scheduled_at = date.toISOString(); }
  const { data, error } = await current.supabase.from("appointments").update(patch).eq("id", id).eq("user_id", current.user.id).select("client_id,property_id").maybeSingle();
  if (error || !data) return { success: false, message: "Não foi possível salvar as alterações." };
  refresh(data.client_id, data.property_id); return { success: true, message: "Visita atualizada com sucesso." };
}
