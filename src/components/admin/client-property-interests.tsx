"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Building2, ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import { addPropertyInterestAction, removePropertyInterestAction } from "@/app/admin/imoveis/actions";
import type { AdminProperty, Client, PropertyInterest } from "@/types";
import { propertyCompatibilityScore } from "@/lib/property-matching";

export function ClientPropertyInterests({ client, initialInterests, properties, demoMode }: { client: Client; initialInterests: PropertyInterest[]; properties: AdminProperty[]; demoMode: boolean }) {
  const [interests, setInterests] = useState(initialInterests);
  const [selected, setSelected] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const compatible = useMemo(() => [...properties].filter((property) => !interests.some((item) => item.propertyId === property.id)).sort((a, b) => propertyCompatibilityScore(b, client) - propertyCompatibilityScore(a, client)), [properties, interests, client]);

  function add() {
    if (!selected) return;
    startTransition(async () => {
      const result = await addPropertyInterestAction(client.id, selected, notes);
      setMessage(result.message);
      if (result.success && demoMode) setInterests((items) => [...items, { id: result.id!, clientId: client.id, propertyId: selected, notes, property: properties.find((item) => item.id === selected) }]);
      if (result.success) { setSelected(""); setNotes(""); }
    });
  }

  function remove(interest: PropertyInterest) {
    if (!window.confirm("Deseja realmente remover este imóvel dos interesses do cliente?")) return;
    startTransition(async () => {
      const result = await removePropertyInterestAction(interest.id, client.id, interest.propertyId);
      setMessage(result.message);
      if (result.success) setInterests((items) => items.filter((item) => item.id !== interest.id));
    });
  }

  return <section className="surface mt-5 rounded-2xl p-5 sm:p-6"><div className="flex flex-col gap-4 border-b border-[#eceeea] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><Building2 size={17} className="text-[#42675b]" /><h2 className="text-base font-extrabold">Imóveis de interesse</h2></div><p className="mt-1 text-xs text-[#7a837e]">Vincule opções compatíveis ao perfil do cliente.</p></div><div className="flex flex-col gap-2 sm:flex-row"><select value={selected} onChange={(event) => setSelected(event.target.value)} aria-label="Selecionar imóvel" className="focus-ring h-10 min-w-[230px] rounded-xl border border-[#dfe3df] bg-white px-3 text-xs outline-none"><option value="">Selecione um imóvel</option>{compatible.map((property) => <option key={property.id} value={property.id}>{property.code} · {property.title} {propertyCompatibilityScore(property, client) >= 3 ? "★" : ""}</option>)}</select><button onClick={add} disabled={!selected || pending} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 text-xs font-bold text-white disabled:opacity-50"><Plus size={14} /> Adicionar</button></div></div>{selected && <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observação sobre este interesse (opcional)" className="focus-ring mt-3 h-10 w-full rounded-xl border border-[#dfe3df] px-3 text-xs outline-none" />}{message && <p className="mt-3 text-xs font-bold text-[#42675b]">{message}</p>}{interests.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{interests.map((interest) => interest.property && <article key={interest.id} className="rounded-xl border border-[#e2e5e1] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9a7748]">{interest.property.code} · {interest.property.purpose}</p><h3 className="mt-1 text-xs font-extrabold">{interest.property.title}</h3><p className="mt-1 text-[10px] text-[#7a837e]">{interest.property.neighborhood} · {currency(interest.property.price)} · {interest.property.status}</p></div><div className="flex gap-1"><Link href={`/admin/imoveis/${interest.property.id}`} aria-label="Abrir imóvel" className="focus-ring grid size-8 place-items-center rounded-lg text-[#557168] hover:bg-[#edf2ef]"><ExternalLink size={14} /></Link><button onClick={() => remove(interest)} aria-label="Remover vínculo" className="focus-ring grid size-8 place-items-center rounded-lg text-[#a54b45] hover:bg-[#fff0ef]"><Trash2 size={14} /></button></div></div>{interest.notes && <p className="mt-3 rounded-lg bg-[#f6f7f4] px-3 py-2 text-[10px] text-[#64706a]">{interest.notes}</p>}</article>)}</div> : <div className="py-10 text-center"><Link2 className="mx-auto text-[#84938d]" /><p className="mt-2 text-sm font-bold">Nenhum imóvel de interesse vinculado.</p><p className="mt-1 text-xs text-[#7a837e]">Use o seletor acima para adicionar uma opção.</p></div>}</section>;
}

function currency(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
