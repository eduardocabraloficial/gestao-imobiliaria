import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { phase5DemoStore } from "@/lib/demo-phase5";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PropertySubmission } from "@/types";
import type { PropertySubmissionRow } from "@/types/database";

export async function listPropertySubmissions(): Promise<{ submissions: PropertySubmission[]; demoMode: boolean }> {
  if (!isSupabaseConfigured()) return { submissions: [...phase5DemoStore.submissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), demoMode: true };
  const user = await getCurrentUser();
  if (!user) return { submissions: [], demoMode: false };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("property_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar as captações.");
  return { submissions: ((data ?? []) as PropertySubmissionRow[]).map((row) => ({ id: row.id, ownerName: row.owner_name, phone: row.phone, email: row.email, purpose: row.purpose, propertyType: row.property_type, neighborhood: row.neighborhood, city: row.city, desiredPrice: row.desired_price === null ? null : Number(row.desired_price), description: row.description ?? "", status: row.status, createdAt: row.created_at })), demoMode: false };
}
