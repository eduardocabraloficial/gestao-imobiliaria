"use server";

import { headers } from "next/headers";
import { phase5DemoStore } from "@/lib/demo-phase5";
import { allowPublicSubmission, validateSubmission, type SubmissionInput } from "@/lib/public-forms";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function submitPropertyAction(input: SubmissionInput) {
  const failure = { success: false, message: "Não foi possível enviar sua solicitação. Tente novamente." };
  if (validateSubmission(input)) return failure;
  const headerStore = await headers();
  const fingerprint = `${headerStore.get("x-forwarded-for")?.split(",")[0] ?? "local"}:submission`;
  if (!allowPublicSubmission(fingerprint, Date.now(), 3)) return { success: false, message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  if (!isSupabaseConfigured()) {
    phase5DemoStore.submissions.unshift({ id: `demo-submission-${Date.now()}`, ownerName: input.ownerName.trim(), phone: input.phone.trim(), email: input.email.trim().toLowerCase(), purpose: input.purpose, propertyType: input.propertyType.trim(), neighborhood: input.neighborhood.trim(), city: input.city.trim(), desiredPrice: input.desiredPrice, description: input.description.trim(), status: "novo", createdAt: new Date().toISOString() });
    return { success: true, message: "Recebemos os dados do seu imóvel. Nossa equipe analisará as informações." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_property_submission", { p_owner_name: input.ownerName, p_phone: input.phone, p_email: input.email, p_purpose: input.purpose, p_property_type: input.propertyType, p_neighborhood: input.neighborhood, p_city: input.city, p_desired_price: input.desiredPrice, p_description: input.description });
  return error ? failure : { success: true, message: "Recebemos os dados do seu imóvel. Nossa equipe analisará as informações." };
}
