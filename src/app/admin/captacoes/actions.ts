"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { phase5DemoStore } from "@/lib/demo-phase5";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PropertySubmissionStatus } from "@/types/database";

export async function updateSubmissionStatusAction(id: string, status: PropertySubmissionStatus) {
  if (!["em_analise", "aprovado", "recusado"].includes(status)) return { success: false, message: "Situação inválida." };
  if (!isSupabaseConfigured()) { const item = phase5DemoStore.submissions.find((submission) => submission.id === id); if (!item) return { success: false, message: "Captação não encontrada." }; item.status = status; return { success: true, message: "Captação atualizada." }; }
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sua sessão expirou." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("property_submissions").update({ status }).eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error) return { success: false, message: "Não foi possível atualizar a captação." };
  if (!data) return { success: false, message: "Captação não encontrada." };
  revalidatePath("/admin/captacoes"); return { success: true, message: "Captação atualizada." };
}
