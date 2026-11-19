"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, Phone } from "lucide-react";
import { moveClientStageAction } from "@/app/admin/clientes/actions";
import { funnelStages, groupClientsByStage } from "@/lib/phase6";
import type { Client } from "@/types";
import type { ClientStageCode } from "@/types/database";

export function FunnelBoard({ initial }: { initial: Client[] }) {
  const [clients, setClients] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const groups = groupClientsByStage(clients);

  function move(client: Client, stage: ClientStageCode) {
    let reason = "";
    if (stage === "perdido") {
      reason = window.prompt("Motivo da perda (preço, desistência, sem retorno, concorrente ou outro):")?.trim() ?? "";
      if (!reason) return;
    }
    const valueRaw = window.prompt("Valor estimado da negociação (opcional):", String(client.estimatedValue ?? ""));
    const value = valueRaw ? Number(valueRaw.replace(/[^0-9.,]/g, "").replace(",", ".")) : null;
    startTransition(async () => {
      const result = await moveClientStageAction(client.id, stage, reason, value);
      setMessage(result.message);
      if (result.success) setClients((current) => current.map((item) => item.id === client.id ? { ...item, stage: funnelStages.find((entry) => entry.code === stage)!.label, estimatedValue: value, lossReason: reason } : item));
    });
  }

  return <>
    {message && <p role="status" className="mb-4 rounded-xl bg-[#edf6f1] px-4 py-3 text-xs font-bold text-[#315d50]">{message}</p>}
    <div className="flex w-full max-w-full snap-x gap-4 overflow-x-auto pb-5">
      {funnelStages.map((stage) => <section key={stage.code} className="w-[280px] shrink-0 snap-start">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-extrabold">{stage.label}</h2><span className="rounded-full bg-[#e5ebe7] px-2 py-1 text-[9px] font-bold">{groups[stage.label].length}</span></div>
        <div className="min-h-32 space-y-3 rounded-2xl bg-[#eef1ed] p-3">
          {groups[stage.label].map((client) => <article key={client.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2"><div><Link href={`/admin/clientes/${client.id}`} className="text-xs font-extrabold hover:text-[#315d50]">{client.name}</Link><p className="mt-1 flex items-center gap-1 text-[10px] text-[#737d78]"><Phone size={10} />{client.phone}</p></div>{client.followUpStatus === "overdue" && <AlertTriangle size={14} className="text-[#b34b45]" />}</div>
            <p className="mt-3 truncate text-[10px] font-semibold">{client.propertyCode ?? client.interest}</p><p className="mt-1 text-[9px] text-[#7a837e]">Retorno: {client.nextFollowUp} · {client.responsible}</p>
            <label className="mt-3 block"><span className="sr-only">Mover {client.name}</span><select disabled={pending} value={stage.code} onChange={(event) => move(client, event.target.value as ClientStageCode)} className="h-8 w-full rounded-lg border border-[#dfe3df] bg-white px-2 text-[10px] font-bold">{funnelStages.map((target) => <option key={target.code} value={target.code}>Mover para {target.label}</option>)}</select></label>
          </article>)}
          {groups[stage.label].length === 0 && <p className="px-3 py-8 text-center text-[10px] text-[#7a837e]">Nenhum cliente nesta etapa.</p>}
        </div>
      </section>)}
    </div>
    <p className="mt-2 flex items-center gap-1 text-[10px] text-[#7a837e]"><ArrowRight size={12} /> Role horizontalmente para visualizar todas as etapas.</p>
  </>;
}
