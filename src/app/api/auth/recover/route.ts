import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { allowRequest, isSameOriginRequest, readSmallJson, requestClientIp, trustedAppOrigin } from "@/lib/security";
import { passwordRecoveryRedirectUrl } from "@/lib/auth-recovery";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
  const body = await readSmallJson<{ email?: string }>(request);
  if (!body) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  if (!allowRequest(`recover:${requestClientIp(request)}:${email}`, 4, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde antes de tentar novamente." }, { status: 429 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Configure o Supabase para recuperar senhas." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const origin = trustedAppOrigin(request);
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: passwordRecoveryRedirectUrl(origin) });
  if (error) return NextResponse.json({ error: "Não foi possível enviar o e-mail de recuperação." }, { status: 400 });
  return NextResponse.json({ message: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação." });
}
