"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { phase5DemoStore } from "@/lib/demo-phase5";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { LeadStatus } from "@/types/database";
import { canConvertLead } from "@/lib/leads";

const validStatuses: LeadStatus[] = ["novo", "em_atendimento", "descartado"];

export async function updateLeadStatusAction(id: string, status: LeadStatus) {
  if (!validStatuses.includes(status)) return { success: false, message: "Situação inválida." };
  if (!isSupabaseConfigured()) { const lead = phase5DemoStore.leads.find((item) => item.id === id); if (!lead || lead.status === "convertido") return { success: false, message: "Lead não encontrado." }; lead.status = status; return { success: true, message: "Lead atualizado." }; }
  const user = await getCurrentUser(); if (!user) return { success: false, message: "Sua sessão expirou." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", id).eq("user_id", user.id).neq("status", "convertido");
  if (error) return { success: false, message: "Não foi possível atualizar o lead." };
  revalidatePath("/admin"); revalidatePath("/admin/leads"); revalidatePath(`/admin/leads/${id}`);
  return { success: true, message: "Lead atualizado." };
}

export async function convertLeadAction(id: string) {
  if (!isSupabaseConfigured()) {
    const lead = phase5DemoStore.leads.find((item) => item.id === id);
    if (!lead || !canConvertLead(lead)) return { success: false, message: "Este lead já foi convertido." };
    lead.status = "convertido"; lead.convertedAt = new Date().toISOString(); lead.convertedClientId = `demo-client-${id}`;
    return { success: true, message: "Lead convertido em cliente.", clientId: lead.convertedClientId };
  }
  const user = await getCurrentUser(); if (!user) return { success: false, message: "Sua sessão expirou." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("convert_lead_to_client", { p_lead_id: id });
  if (error) return { success: false, message: error.message.includes("already") ? "Este lead já foi convertido." : "Não foi possível converter o lead." };
  revalidatePath("/admin"); revalidatePath("/admin/leads"); revalidatePath("/admin/clientes");
  return { success: true, message: "Lead convertido em cliente.", clientId: data };
}
