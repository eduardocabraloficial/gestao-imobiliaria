import { NextResponse } from "next/server";
import { createSupabaseServerClient, isDemoModeEnabled, isSupabaseConfigured } from "@/lib/supabase/server";
import { allowRequest, isSameOriginRequest, readSmallJson, requestClientIp } from "@/lib/security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
  const body = await readSmallJson<{ email?: string; password?: string }>(request);
  if (!body) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  const email = body.email?.trim().toLowerCase();

  if (!email || !body.password || body.password.length < 6) {
    return NextResponse.json(
      { error: "Informe um e-mail válido e uma senha com pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  if (!allowRequest(`login:${requestClientIp(request)}:${email}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: body.password,
    });

    if (error) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  if (!isDemoModeEnabled()) return NextResponse.json({ error: "Autenticação indisponível." }, { status: 503 });

  const response = NextResponse.json({ ok: true, demo: true });
  response.cookies.set("demo-session", email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
