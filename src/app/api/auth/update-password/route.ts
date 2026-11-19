import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isSameOriginRequest, readSmallJson } from "@/lib/security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
  const body = await readSmallJson<{ password?: string }>(request);
  if (!body) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  const { password } = body;
  if (!password || password.length < 8) return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 401 });
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return NextResponse.json({ error: "Não foi possível atualizar a senha." }, { status: 400 });
  await supabase.auth.signOut();
  return NextResponse.json({ message: "Senha atualizada com sucesso." });
}
