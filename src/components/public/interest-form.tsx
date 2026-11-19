"use client";

import { useState, useTransition } from "react";
import { submitInterestAction } from "@/app/imoveis/[slug]/actions";

export function InterestForm({ slug, code }: { slug: string; code: string }) {
  const [pending, startTransition] = useTransition(); const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(async () => setResult(await submitInterestAction({ propertySlug: slug, name: String(form.get("name")), phone: String(form.get("phone")), whatsapp: String(form.get("whatsapp")), email: String(form.get("email")), message: String(form.get("message")), website: String(form.get("website")) }))); }
  return <form onSubmit={submit} className="mt-5 space-y-3">
    <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
    <FieldLabel text="Nome"><input name="name" required minLength={2} maxLength={100} placeholder="Seu nome" className="field" /></FieldLabel>
    <FieldLabel text="Telefone"><input name="phone" required maxLength={30} placeholder="Telefone" className="field" /></FieldLabel>
    <FieldLabel text="WhatsApp (opcional)"><input name="whatsapp" maxLength={30} placeholder="WhatsApp (opcional)" className="field" /></FieldLabel>
    <FieldLabel text="E-mail"><input name="email" type="email" required maxLength={160} placeholder="E-mail" className="field" /></FieldLabel>
    <FieldLabel text="Mensagem"><textarea name="message" required minLength={3} maxLength={1000} defaultValue={`Tenho interesse no imóvel ${code}.`} className="focus-ring min-h-24 w-full resize-none rounded-xl border border-[#dfe3df] p-3 text-xs outline-none" /></FieldLabel>
    {result && <p role={result.success ? "status" : "alert"} className={`rounded-xl px-3 py-2.5 text-xs font-bold ${result.success ? "bg-[#edf6f1] text-[#315d50]" : "bg-[#fff1f0] text-[#a8443f]"}`}>{result.message}</p>}
    <button disabled={pending} className="focus-ring w-full rounded-xl bg-[#173f35] px-4 py-3 text-xs font-bold text-white disabled:opacity-60">{pending ? "Enviando..." : "Tenho interesse"}</button>
  </form>;
}

function FieldLabel({ text, children }: { text: string; children: React.ReactNode }) {
  return <label><span className="sr-only">{text}</span>{children}</label>;
}
