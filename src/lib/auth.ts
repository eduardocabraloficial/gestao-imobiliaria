import { cookies } from "next/headers";
import { createSupabaseServerClient, isDemoModeEnabled, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    if (!isDemoModeEnabled()) return null;
    const demoSession = (await cookies()).get("demo-session")?.value;
    return demoSession
      ? { id: "demo-user", email: demoSession, name: "Marina Costa" }
      : null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    name: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Corretor",
  };
}
