import type { Lead } from "@/types";

export function canConvertLead(lead: Pick<Lead, "status" | "convertedClientId">) {
  return lead.status !== "convertido" && !lead.convertedClientId;
}

export function leadBelongsToUser(leadUserId: string, currentUserId: string) {
  return Boolean(currentUserId) && leadUserId === currentUserId;
}

export function convertedInterestLink(lead: Pick<Lead, "id" | "propertyId">, clientId: string) {
  return { id: `lead-interest-${lead.id}`, clientId, propertyId: lead.propertyId, notes: "Interesse originado pelo portal público." };
}
