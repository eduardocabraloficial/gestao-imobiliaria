export interface InterestInput { propertySlug: string; name: string; phone: string; whatsapp: string; email: string; message: string; website: string }
export interface SubmissionInput { ownerName: string; phone: string; email: string; purpose: "venda" | "aluguel"; propertyType: string; neighborhood: string; city: string; desiredPrice: number | null; description: string; website: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s.-]{8,30}$/;
const safeId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateInterest(input: InterestInput) {
  if (input.website) return "invalid";
  if (!safeId.test(input.propertySlug) || input.propertySlug.length > 180) return "invalid";
  if (input.name.trim().length < 2 || input.name.trim().length > 100) return "invalid";
  if (!phonePattern.test(input.phone.trim()) || (input.whatsapp && !phonePattern.test(input.whatsapp.trim()))) return "invalid";
  if (!emailPattern.test(input.email.trim()) || input.email.length > 160) return "invalid";
  if (input.message.trim().length < 3 || input.message.trim().length > 1000) return "invalid";
  return null;
}

export function validateSubmission(input: SubmissionInput) {
  if (input.website) return "invalid";
  if (input.ownerName.trim().length < 2 || input.ownerName.length > 100) return "invalid";
  if (!phonePattern.test(input.phone.trim()) || !emailPattern.test(input.email.trim())) return "invalid";
  if (!['venda', 'aluguel'].includes(input.purpose)) return "invalid";
  if ([input.propertyType, input.neighborhood, input.city].some((value) => value.trim().length < 2 || value.length > 100)) return "invalid";
  if (input.desiredPrice !== null && (!Number.isFinite(input.desiredPrice) || input.desiredPrice < 0)) return "invalid";
  if (input.description.length > 1500) return "invalid";
  return null;
}

const attempts = new Map<string, number[]>();
export function allowPublicSubmission(key: string, now = Date.now(), limit = 5, windowMs = 10 * 60_000) {
  const recent = (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now); attempts.set(key, recent); return true;
}
