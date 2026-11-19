"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/types";

export function LeadsManager({ leads, initialFilter }: { leads: Lead[]; initialFilter?: string }) {
  const router = useRouter();
  const validInitial = ["novo", "em_atendimento", "convertido", "descartado"].includes(initialFilter ?? "") ? initialFilter! : "all";
  const [filter, setFilter] = useState(validInitial);
  const filtered = useMemo(() => filter === "all" ? leads : leads.filter((lead) => lead.status === filter), [filter, leads]);
  return <div className="surface overflow-hidden rounded-2xl"><div className="flex flex-col gap-3 border-b border-[#eceeea] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2 overflow-x-auto">{[["all","Todos"],["novo","Novos"],["em_atendimento","Em atendimento"],["convertido","Convertidos"],["descartado","Descartados"]].map(([key,label]) => <button key={key} onClick={() => { setFilter(key); router.replace(key === "all" ? "/admin/leads" : `/admin/leads?status=${key}`, { scroll: false }); }} className={`rounded-lg px-3 py-2 text-[10px] font-bold ${filter === key ? "bg-[#173f35] text-white" : "bg-[#f0f2ef] text-[#5f6964]"}`}>{label}</button>)}</div><span className="text-[10px] font-bold text-[#7a837e]">{filtered.length} lead(s)</span></div>{filtered.length ? <div className="divide-y divide-[#eceeea]">{filtered.map((lead) => <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="flex items-center gap-3 p-4 hover:bg-[#fbfcfa]"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8eff6] text-[#476b8d]"><UserRoundPlus size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold">{lead.name}</p><Status status={lead.status} /></div><p className="mt-1 truncate text-[10px] text-[#7a837e]">{lead.phone} · {lead.propertyCode} — {lead.propertyTitle}</p><p className="mt-1 text-[9px] uppercase text-[#909893]">Site · {date(lead.createdAt)}</p></div><ArrowRight size={15} /></Link>)}</div> : <div className="p-14 text-center"><UserRoundPlus className="mx-auto text-[#84938d]" /><p className="mt-3 text-sm font-extrabold">Nenhum lead nesta situação.</p></div>}</div>;
}
export function Status({ status }: { status: Lead["status"] }) { const tone = status === "novo" ? "bg-[#e8eff6] text-[#476b8d]" : status === "em_atendimento" ? "bg-[#fff1db] text-[#9a6b28]" : status === "convertido" ? "bg-[#e7f0eb] text-[#356454]" : "bg-[#f0f2ef] text-[#59635e]"; return <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${tone}`}>{status.replaceAll("_", " ")}</span>; }
const date = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
