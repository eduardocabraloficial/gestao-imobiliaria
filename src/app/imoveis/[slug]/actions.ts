"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createDemoLead } from "@/lib/data/leads";
import { allowPublicSubmission, validateInterest, type InterestInput } from "@/lib/public-forms";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type PublicActionResult = { success: boolean; message: string };

export async function submitInterestAction(input: InterestInput): Promise<PublicActionResult> {
  if (validateInterest(input)) return { success: false, message: "Não foi possível enviar sua solicitação. Tente novamente." };
  const headerStore = await headers();
  const fingerprint = `${headerStore.get("x-forwarded-for")?.split(",")[0] ?? "local"}:interest`;
  if (!allowPublicSubmission(fingerprint)) return { success: false, message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  if (!isSupabaseConfigured()) {
    const lead = createDemoLead(input.propertySlug, { name: input.name.trim(), phone: input.phone.trim(), whatsapp: input.whatsapp.trim(), email: input.email.trim().toLowerCase(), message: input.message.trim() });
    return lead ? { success: true, message: "Recebemos seu interesse. Em breve entraremos em contato." } : { success: false, message: "Não foi possível enviar sua solicitação. Tente novamente." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_property_lead", { p_slug: input.propertySlug, p_name: input.name, p_phone: input.phone, p_whatsapp: input.whatsapp, p_email: input.email, p_message: input.message });
  if (error) return { success: false, message: "Não foi possível enviar sua solicitação. Tente novamente." };
  revalidatePath("/admin"); revalidatePath("/admin/leads");
  return { success: true, message: "Recebemos seu interesse. Em breve entraremos em contato." };
}
