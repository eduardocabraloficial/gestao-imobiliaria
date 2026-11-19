"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Mail, MessageCircle, Pencil, Phone, Plus, Save, X } from "lucide-react";
import { addInteractionAction, completeFollowUpAction, saveFollowUpAction, updateClientAction, updateClientStageAction } from "@/app/admin/clientes/actions";
import type { Client, ClientInput, ClientStage, FollowUp, Interaction } from "@/types";
import type { InteractionType } from "@/types/database";
import { ContactActions } from "@/components/admin/contact-actions";

const stages: ClientStage[] = ["Novo lead", "Primeiro contato", "Qualificação", "Imóveis enviados", "Visita agendada", "Visita realizada", "Negociação", "Proposta", "Documentação", "Concluído", "Perdido"];
const interactionLabels: Record<InteractionType, string> = { ligacao: "Ligação", whatsapp: "WhatsApp", email: "E-mail", reuniao: "Reunião", visita: "Visita", observacao: "Observação" };
const demoHistory: Interaction[] = [
  { id: "demo-1", type: "whatsapp", occurredAt: "2026-11-09T09:15:00-03:00", description: "Cliente confirmou interesse e pediu novas opções na mesma região.", responsible: "Marina Costa" },
  { id: "demo-2", type: "ligacao", occurredAt: "2026-11-06T16:40:00-03:00", description: "Alinhamos orçamento, prazo e preferência por andar alto.", responsible: "Marina Costa" },
];

export function ClientDetail({ client, initialInteractions, followUp, demoMode }: { client: Client; initialInteractions: Interaction[]; followUp: FollowUp | null; demoMode: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<ClientStage>(client.stage);
  const [history, setHistory] = useState(initialInteractions.length ? initialInteractions : demoMode ? demoHistory : []);
  const [currentFollowUp, setCurrentFollowUp] = useState(followUp);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [interactionType, setInteractionType] = useState<InteractionType>("ligacao");
  const [interactionDescription, setInteractionDescription] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function notify(text: string, failed = false) {
    if (failed) setError(text); else setMessage(text);
    window.setTimeout(() => { setMessage(""); setError(""); }, 4000);
  }

  function changeStage(nextStage: ClientStage) {
    startTransition(async () => {
      const result = await updateClientStageAction(client.id, nextStage);
      if (!result.success) return notify(result.message, true);
      setStage(nextStage); notify(result.message); router.refresh();
    });
  }

  function registerInteraction(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await addInteractionAction(client.id, interactionType, interactionDescription);
      if (!result.success) return notify(result.message, true);
      if (demoMode) setHistory((items) => [{ id: crypto.randomUUID(), type: interactionType, occurredAt: new Date().toISOString(), description: interactionDescription, responsible: "Marina Costa" }, ...items]);
      setInteractionDescription(""); notify(result.message); router.refresh();
    });
  }

  function saveFollowUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scheduledAt = String(form.get("scheduledAt"));
    const notes = String(form.get("notes"));
    startTransition(async () => {
      const result = await saveFollowUpAction(client.id, scheduledAt, notes);
      if (!result.success) return notify(result.message, true);
      if (demoMode) setCurrentFollowUp({ id: "demo-follow-up", scheduledAt: new Date(scheduledAt).toISOString(), notes, status: "pendente", completedAt: null });
      notify(result.message); router.refresh();
    });
  }

  function completeFollowUp() {
    const id = currentFollowUp?.id ?? client.followUpId;
    if (!id) return;
    startTransition(async () => {
      const result = await completeFollowUpAction(client.id, id);
      if (!result.success) return notify(result.message, true);
      setCurrentFollowUp(null); notify(result.message); router.refresh();
    });
  }

  function updateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: ClientInput = {
      name: String(form.get("name")), phone: String(form.get("phone")), whatsapp: String(form.get("whatsapp")), email: String(form.get("email")), source: String(form.get("source")), purpose: String(form.get("purpose")), propertyType: String(form.get("propertyType")), neighborhoods: String(form.get("neighborhoods")).split(",").map((item) => item.trim()).filter(Boolean), minPrice: Number(form.get("minPrice")) || null, maxPrice: Number(form.get("maxPrice")) || null, bedrooms: Number(form.get("bedrooms")) || null, notes: String(form.get("notes")),
    };
    startTransition(async () => {
      const result = await updateClientAction(client.id, input);
      if (!result.success) return notify(result.message, true);
      setEditOpen(false); notify(result.message); router.refresh();
    });
  }

  return <>
    {message && <Alert text={message} />}{error && <Alert text={error} error />}
    <div className="grid min-w-0 gap-5 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#dfe9e4] text-sm font-extrabold text-[#315d50]">{client.initials}</span><div><h1 className="text-xl font-extrabold tracking-[-0.03em]">{client.name}</h1><p className="mt-1 text-xs text-[#77817c]">Cliente desde {formatDate(client.createdAt)} · Origem: {client.source}</p><div className="mt-3 flex flex-wrap items-center gap-2"><ContactActions phone={client.phone} whatsapp={client.whatsapp} />{client.email && <a href={`mailto:${client.email}`} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[#dfe3df] px-2.5 py-1.5 text-[10px] font-bold"><Mail size={12} /> {client.email}</a>}</div></div></div><button onClick={() => setEditOpen(true)} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe3df] px-4 py-2.5 text-xs font-bold"><Pencil size={14} /> Editar cliente</button></div></section>

        <section className="surface rounded-2xl p-5 sm:p-6"><div className="mb-5"><h2 className="text-base font-extrabold">Etapa do atendimento</h2><p className="mt-1 text-xs text-[#7a837e]">Atualize conforme o cliente avança no processo.</p></div><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">{stages.map((item, index) => { const selected = item === stage; const passed = stages.indexOf(stage) > index; return <button disabled={pending} key={item} onClick={() => changeStage(item)} className={`focus-ring min-w-[118px] rounded-xl border px-3 py-3 text-left disabled:opacity-60 ${selected ? "border-[#315d50] bg-[#edf4f0]" : passed ? "border-[#d7e4dc] bg-white" : "border-[#e7e9e6] bg-[#fafbf9]"}`}><span className={`mb-2 grid size-5 place-items-center rounded-full text-[9px] font-bold ${selected || passed ? "bg-[#315d50] text-white" : "bg-[#e8ebe8] text-[#7e8782]"}`}>{passed ? <Check size={11} /> : index + 1}</span><span className={`block text-[10px] font-bold ${selected ? "text-[#315d50]" : "text-[#68726d]"}`}>{item}</span></button>; })}</div></section>

        <section className="surface rounded-2xl p-5 sm:p-6"><div className="mb-5"><h2 className="text-base font-extrabold">Histórico de atendimentos</h2><p className="mt-1 text-xs text-[#7a837e]">Registros ordenados do mais recente para o mais antigo.</p></div><form onSubmit={registerInteraction} className="mb-6 grid gap-2 rounded-xl bg-[#f6f8f5] p-3 sm:grid-cols-[140px_1fr_auto]"><select value={interactionType} onChange={(event) => setInteractionType(event.target.value as InteractionType)} className="focus-ring h-10 rounded-xl border border-[#dfe3df] bg-white px-3 text-xs outline-none">{Object.entries(interactionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input value={interactionDescription} onChange={(event) => setInteractionDescription(event.target.value)} required placeholder="Descreva o contato realizado" className="focus-ring h-10 rounded-xl border border-[#dfe3df] px-3 text-xs outline-none" /><button disabled={pending} className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#173f35] px-4 text-xs font-bold text-white disabled:opacity-60"><Plus size={14} /> Registrar</button></form>{history.length ? <div>{history.map((event, index) => <HistoryItem key={event.id} item={event} last={index === history.length - 1} />)}</div> : <div className="py-8 text-center"><MessageCircle className="mx-auto text-[#84938d]" /><p className="mt-2 text-sm font-bold">Nenhum atendimento registrado.</p><p className="mt-1 text-xs text-[#7a837e]">Use o formulário acima para criar o primeiro registro.</p></div>}</section>
      </div>

      <aside className="min-w-0 space-y-5">
        {currentFollowUp || client.followUpId ? <section className="rounded-2xl border border-[#e9d8d4] bg-[#fffafa] p-5"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fae5e2] text-[#b34b45]"><CalendarClock size={17} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a34d47]">Próximo retorno</p><p className="mt-1 text-sm font-extrabold">{currentFollowUp ? formatDateTime(currentFollowUp.scheduledAt) : `${client.nextFollowUp} às ${client.followUpTime}`}</p><p className="mt-2 text-xs leading-5 text-[#756663]">{currentFollowUp?.notes || "Retorno pendente para este cliente."}</p></div></div><button disabled={pending} onClick={completeFollowUp} className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#b54d47] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"><Check size={14} /> Concluir retorno</button></section> : <section className="surface rounded-2xl p-5 text-center"><CalendarClock className="mx-auto text-[#789087]" /><p className="mt-2 text-sm font-extrabold">Nenhum retorno pendente.</p></section>}
        <section className="surface rounded-2xl p-5"><h2 className="text-sm font-extrabold">Interesses</h2><dl className="mt-4 space-y-3 text-xs"><Info label="Finalidade" value={client.purpose || "A definir"} /><Info label="Tipo de imóvel" value={client.propertyType || client.interest} /><Info label="Faixa de preço" value={client.budget} /><Info label="Quartos" value={`${client.bedrooms || "A definir"}`} /><Info label="Bairros" value={client.neighborhoods.join(", ") || "A definir"} /></dl></section>
        <section className="surface rounded-2xl p-5"><h2 className="text-sm font-extrabold">Definir próximo retorno</h2><form onSubmit={saveFollowUp}><label className="mt-4 block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f7974]">Data e horário</span><input name="scheduledAt" type="datetime-local" required className="focus-ring h-10 w-full rounded-xl border border-[#dfe3df] px-3 text-xs outline-none" /></label><label className="mt-3 block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f7974]">Observação</span><textarea name="notes" defaultValue={currentFollowUp?.notes ?? ""} className="focus-ring min-h-20 w-full resize-none rounded-xl border border-[#dfe3df] p-3 text-xs outline-none" /></label><button disabled={pending} className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"><Save size={14} /> {pending ? "Salvando..." : "Salvar próximo retorno"}</button></form></section>
      </aside>
    </div>
    {editOpen && <EditModal client={client} pending={pending} onClose={() => setEditOpen(false)} onSubmit={updateClient} />}
  </>;
}

function HistoryItem({ item, last }: { item: Interaction; last: boolean }) { const Icon = item.type === "email" ? Mail : item.type === "whatsapp" ? MessageCircle : Phone; return <div className="relative flex gap-4 pb-6 last:pb-0"><div className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-[#edf2ef] text-[#42675b]"><Icon size={15} /></div>{!last && <span className="absolute left-[17px] top-9 h-[calc(100%-28px)] w-px bg-[#e2e6e2]" />}<div className="pt-0.5"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold">{interactionLabels[item.type]}</p><span className="text-[10px] text-[#89918d]">{formatDateTime(item.occurredAt)}</span></div><p className="mt-1 text-xs leading-5 text-[#626c67]">{item.description}</p><p className="mt-1 text-[10px] font-semibold text-[#8a928e]">{item.responsible}</p></div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-[10px] font-semibold text-[#8a928e]">{label}</dt><dd className="mt-0.5 font-bold text-[#34413c]">{value}</dd></div>; }
function Alert({ text, error = false }: { text: string; error?: boolean }) { return <div role={error ? "alert" : "status"} className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${error ? "border-[#f0d4d1] bg-[#fff4f3] text-[#a8443f]" : "border-[#cfe1d7] bg-[#edf6f1] text-[#315d50]"}`}><Check size={15} />{text}</div>; }
function formatDate(value?: string) { return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "este mês"; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }

function EditModal({ client, pending, onClose, onSubmit }: { client: Client; pending: boolean; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#10241f]/55 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-client-title"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#eceeea] p-5"><div><h2 id="edit-client-title" className="text-lg font-extrabold">Editar cliente</h2><p className="text-xs text-[#77817c]">Atualize os dados de contato e preferências.</p></div><button onClick={onClose} aria-label="Fechar" className="focus-ring grid size-8 place-items-center rounded-lg"><X size={18} /></button></div><form onSubmit={onSubmit} className="grid gap-4 p-5 sm:grid-cols-2"><Field name="name" label="Nome" defaultValue={client.name} required /><Field name="phone" label="Telefone" defaultValue={client.phone} required /><Field name="whatsapp" label="WhatsApp" defaultValue={client.whatsapp} /><Field name="email" label="E-mail" defaultValue={client.email} type="email" /><Field name="source" label="Origem" defaultValue={client.source} /><Field name="purpose" label="Finalidade" defaultValue={client.purpose} /><Field name="propertyType" label="Tipo de imóvel" defaultValue={client.propertyType} /><Field name="bedrooms" label="Quartos" defaultValue={client.bedrooms || ""} type="number" /><div className="sm:col-span-2"><Field name="neighborhoods" label="Bairros" defaultValue={client.neighborhoods.join(", ")} /></div><Field name="minPrice" label="Preço mínimo" defaultValue={client.minPrice ?? ""} type="number" /><Field name="maxPrice" label="Preço máximo" defaultValue={client.maxPrice ?? ""} type="number" /><div className="sm:col-span-2"><Field name="notes" label="Observações" defaultValue={client.note} /></div><div className="flex justify-end gap-2 border-t border-[#eceeea] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="focus-ring rounded-xl border border-[#dfe3df] px-4 py-2.5 text-xs font-bold">Cancelar</button><button disabled={pending} className="focus-ring rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{pending ? "Salvando..." : "Salvar alterações"}</button></div></form></div></div>;
}
function Field({ name, label, defaultValue, type = "text", required }: { name: string; label: string; defaultValue?: string | number; type?: string; required?: boolean }) { return <label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f7974]">{label}</span><input name={name} type={type} required={required} defaultValue={defaultValue} className="focus-ring h-10 w-full rounded-xl border border-[#dfe3df] px-3 text-xs outline-none" /></label>; }
