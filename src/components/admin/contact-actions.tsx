"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { formatBrazilianPhone } from "@/lib/phase7";

export function ContactActions({ phone, whatsapp }: { phone: string; whatsapp?: string }) {
  const [copied, setCopied] = useState(false);
  const target = (whatsapp || phone).replace(/\D/g, "");
  const international = target.startsWith("55") ? target : `55${target}`;
  return <div className="flex flex-wrap gap-2"><button type="button" onClick={async () => { await navigator.clipboard.writeText(phone); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }} className="action" aria-label="Copiar telefone">{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copiado" : formatBrazilianPhone(phone)}</button><a href={`https://wa.me/${international}`} target="_blank" rel="noreferrer" className="action text-[#315d50]"><MessageCircle size={13} /> Abrir WhatsApp</a></div>;
}
