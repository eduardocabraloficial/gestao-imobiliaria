"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { safeInternalPath } from "@/lib/security";

export function LoginForm({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(params.get("senha") === "alterada" ? "Senha atualizada com sucesso. Entre com a nova senha." : "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Não foi possível entrar.");
      setLoading(false);
      return;
    }
    router.push(safeInternalPath(params.get("redirectTo")));
    router.refresh();
  }

  async function recoverPassword() {
    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    const email = emailInput?.value ?? "";
    setError(""); setNotice("");
    const response = await fetch("/api/auth/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Não foi possível recuperar a senha.");
    else setNotice(data.message);
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      {demoMode && <div className="rounded-xl border border-[#eadfc8] bg-[#fff9ec] px-3 py-2.5 text-[11px] leading-4 text-[#7d6338]"><strong>Modo demonstração:</strong> use qualquer e-mail e uma senha com 6 ou mais caracteres.</div>}
      {error && <div role="alert" className="rounded-xl border border-[#f0d4d1] bg-[#fff4f3] px-3 py-2.5 text-[11px] font-semibold text-[#a8443f]">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-[#cfe1d7] bg-[#edf6f1] px-3 py-2.5 text-[11px] font-semibold text-[#315d50]">{notice}</div>}
      <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#555555]">E-mail</span><input name="email" type="email" required defaultValue={demoMode ? "corretor@cabralhouse.com.br" : ""} placeholder="voce@cabralhouse.com.br" autoComplete="email" className="field h-12 text-sm placeholder:text-[#999999]" /></label>
      <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#555555]">Senha</span><span className="relative block"><input name="password" type={showPassword ? "text" : "password"} required minLength={6} defaultValue={demoMode ? "demo123" : ""} placeholder="Sua senha" autoComplete="current-password" className="field h-12 pr-11 text-sm placeholder:text-[#999999]" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="focus-ring absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#666666]" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
      <div className="flex justify-end"><button type="button" onClick={recoverPassword} className="focus-ring rounded text-xs font-bold text-[#795a25] hover:underline">Esqueci minha senha</button></div>
      <button disabled={loading} className="focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#111111] text-sm font-bold text-white transition-colors hover:bg-[#202021] disabled:opacity-70">{loading ? <LoaderCircle className="animate-spin" size={16} /> : "Entrar no sistema"}</button>
    </form>
  );
}
