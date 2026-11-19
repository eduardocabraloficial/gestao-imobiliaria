"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, UserRoundCheck, XCircle } from "lucide-react";
import { convertLeadAction, updateLeadStatusAction } from "@/app/admin/leads/actions";
import type { Lead } from "@/types";

export function LeadActions({ lead }: { lead: Lead }) {
  const [pending, startTransition] = useTransition(); const [message, setMessage] = useState(""); const [clientId, setClientId] = useState(lead.convertedClientId);
  const act = (status: "em_atendimento" | "descartado") => { if (status === "descartado" && !window.confirm("Deseja realmente descartar este lead?")) return; startTransition(async () => setMessage((await updateLeadStatusAction(lead.id, status)).message)); };
  const convert = () => startTransition(async () => { const result = await convertLeadAction(lead.id); setMessage(result.message); if (result.success) setClientId(result.clientId ?? null); });
  return <div className="mt-6 space-y-3">{message && <p role="status" className="rounded-xl bg-[#edf6f1] px-4 py-3 text-xs font-bold text-[#315d50]">{message}</p>}<div className="flex flex-col gap-2 sm:flex-row">{clientId ? <Link href={`/admin/clientes/${clientId}`} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-3 text-xs font-bold text-white"><ExternalLink size={14} /> Abrir cliente</Link> : <><button onClick={() => act("em_atendimento")} disabled={pending} className="action justify-center"><CheckCircle2 size={14} /> Marcar em atendimento</button><button onClick={convert} disabled={pending} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-3 text-xs font-bold text-white"><UserRoundCheck size={14} /> Converter em cliente</button><button onClick={() => act("descartado")} disabled={pending} className="action justify-center text-[#a54b45]"><XCircle size={14} /> Descartar</button></>}</div></div>;
}
