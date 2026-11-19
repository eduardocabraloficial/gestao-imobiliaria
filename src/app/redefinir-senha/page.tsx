"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Brand } from "@/components/brand";
import {
  hasPasswordRecoveryParams,
  isPasswordRecoveryEvent,
  PASSWORD_RECOVERY_MARKER,
  PASSWORD_RECOVERY_PATH,
} from "@/lib/auth-recovery";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RecoveryStatus = "validating" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [status, setStatus] = useState<RecoveryStatus>("validating");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const hasRecoveryParams = hasPasswordRecoveryParams(window.location.search, window.location.hash);
    const authError = new URLSearchParams(window.location.search).get("error_description");
    if (authError) {
      queueMicrotask(() => {
        setError("O link de recuperação é inválido ou expirou. Solicite um novo link.");
        setStatus("invalid");
      });
      return;
    }

    let settled = false;
    const markReady = () => {
      settled = true;
      sessionStorage.setItem(PASSWORD_RECOVERY_MARKER, "1");
      window.history.replaceState({}, "", PASSWORD_RECOVERY_PATH);
      setStatus("ready");
    };
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isPasswordRecoveryEvent(event) && session) markReady();
    });

    void supabase.auth.getUser().then(({ data, error: userError }) => {
      if (!userError && data.user && (hasRecoveryParams || sessionStorage.getItem(PASSWORD_RECOVERY_MARKER) === "1")) markReady();
      else if (!hasRecoveryParams) setStatus("invalid");
    });

    const timeout = window.setTimeout(() => {
      if (!settled) {
        setError("Não foi possível validar o link de recuperação. Ele pode ter expirado.");
        setStatus("invalid");
      }
    }, 6000);
    return () => {
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      setPending(false);
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      setPending(false);
      return;
    }
    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Não foi possível atualizar a senha.");
      setPending(false);
      if (response.status === 401) setStatus("invalid");
      return;
    }
    sessionStorage.removeItem(PASSWORD_RECOVERY_MARKER);
    setStatus("success");
    window.setTimeout(() => {
      router.replace("/login?senha=alterada");
      router.refresh();
    }, 1200);
  }

  return <main className="grid min-h-screen place-items-center bg-[#f7f8f5] p-5"><section className="surface w-full max-w-md rounded-3xl p-7 sm:p-9"><Brand /><p className="mt-8 text-[10px] font-bold uppercase tracking-[0.17em] text-[#9a7748]">Segurança da conta</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">Defina sua nova senha</h1>{status === "validating" && <div role="status" className="mt-6 flex items-center gap-3 rounded-xl bg-[#edf2ef] px-4 py-3 text-sm text-[#52625b]"><LoaderCircle className="animate-spin" size={17} /> Validando o link de recuperação...</div>}{status === "success" && <div role="status" className="mt-6 rounded-xl border border-[#cfe1d7] bg-[#edf6f1] px-4 py-3 text-sm font-semibold text-[#315d50]">Senha atualizada com sucesso. Redirecionando para o login...</div>}{status === "invalid" && <div className="mt-6"><p role="alert" className="rounded-xl bg-[#fff4f3] px-4 py-3 text-sm font-semibold text-[#a8443f]">{error || "Abra esta página pelo link enviado no e-mail de recuperação."}</p><Link href="/login" className="focus-ring mt-4 inline-flex rounded-xl border border-[#dce1dd] px-4 py-2.5 text-xs font-bold">Voltar ao login</Link></div>}{status === "ready" && <><p className="mt-2 text-sm text-[#747e79]">Use pelo menos oito caracteres.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-[#fff4f3] px-3 py-2.5 text-xs font-semibold text-[#a8443f]">{error}</p>}<form onSubmit={submit} className="mt-6 space-y-4"><Field name="password" label="Nova senha" /><Field name="confirmation" label="Confirmar senha" /><button disabled={pending} className="focus-ring h-11 w-full rounded-xl bg-[#173f35] text-xs font-bold text-white disabled:opacity-60">{pending ? "Atualizando..." : "Atualizar senha"}</button></form></>}</section></main>;
}

function Field({ name, label }: { name: string; label: string }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.11em] text-[#68746e]">{label}</span><input name={name} type="password" minLength={8} required autoComplete="new-password" className="focus-ring h-11 w-full rounded-xl border border-[#dce1dd] px-3 outline-none" /></label>;
}
