"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Filter, Search, UserRoundPlus, X } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import type { Client } from "@/types";
import { createClientAction } from "@/app/admin/clientes/actions";
import { QuickInteractionButton } from "@/components/admin/quick-interaction-button";
import { clientFilterQuery, paginate } from "@/lib/phase7";

export function ClientsManager({ initialClients, openOnLoad = false, demoMode, initialQuery = "", initialStatus = "all", initialPage = 1 }: { initialClients: Client[]; openOnLoad?: boolean; demoMode: boolean; initialQuery?: string; initialStatus?: string; initialPage?: number }) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [modalOpen, setModalOpen] = useState(openOnLoad);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => clients.filter((client) => {
    const matchesQuery = `${client.name} ${client.email} ${client.phone} ${client.interest}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || client.followUpStatus === status);
  }), [clients, query, status]);
  const pagination = useMemo(() => paginate(filtered, page, 10), [filtered, page]);

  function updateUrl(nextQuery: string, nextStatus: string, nextPage: number) {
    const params = clientFilterQuery(nextQuery, nextStatus, nextPage);
    router.replace(`/admin/clientes${params ? `?${params}` : ""}`, { scroll: false });
  }

  function addClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const minPrice = Number(String(form.get("minPrice") || "").replace(/\D/g, "")) || null;
    const maxPrice = Number(String(form.get("maxPrice") || "").replace(/\D/g, "")) || null;
    const input = {
      name, phone: String(form.get("phone")), whatsapp: String(form.get("whatsapp") || form.get("phone")),
      email: String(form.get("email")), source: String(form.get("source")), purpose: String(form.get("purpose")),
      propertyType: String(form.get("propertyType")), neighborhoods: String(form.get("neighborhoods") || "").split(",").map((item) => item.trim()).filter(Boolean),
      minPrice, maxPrice, bedrooms: Number(form.get("bedrooms")) || null, notes: String(form.get("note") || ""),
    };
    const newClient: Client = {
      id: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
      name,
      initials: name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      phone: String(form.get("phone")),
      whatsapp: String(form.get("phone")),
      email: String(form.get("email")),
      source: String(form.get("source")),
      interest: input.propertyType || "Busca personalizada",
      stage: "Novo lead",
      lastContact: "Hoje",
      nextFollowUp: "A definir",
      followUpTime: "—",
      followUpStatus: "scheduled",
      responsible: "Marina Costa",
      budget: maxPrice ? `Até R$ ${maxPrice.toLocaleString("pt-BR")}` : "A definir",
      neighborhoods: input.neighborhoods,
      bedrooms: input.bedrooms ?? 0,
      note: String(form.get("note") || ""),
    };
    setError("");
    startTransition(async () => {
      const result = await createClientAction(input);
      if (!result.success) { setError(result.message); return; }
      if (demoMode) setClients((current) => [newClient, ...current]);
      setModalOpen(false); setSuccess(result.message); router.refresh();
      window.setTimeout(() => setSuccess(""), 4000);
    });
  }

  return (
    <>
      {success && <div role="status" className="mb-4 rounded-xl border border-[#cfe1d7] bg-[#edf6f1] px-4 py-3 text-xs font-bold text-[#315d50]">{success}</div>}
      {error && <div role="alert" className="mb-4 rounded-xl border border-[#f0d4d1] bg-[#fff4f3] px-4 py-3 text-xs font-bold text-[#a8443f]">{error}</div>}
      <div className="surface rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-[#eceeea] p-4 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a09b]" size={16} />
            <input value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setPage(1); updateUrl(value, status, 1); }} placeholder="Buscar por nome, telefone, e-mail ou imóvel..." className="focus-ring h-10 w-full rounded-xl border border-[#e0e4df] bg-[#fafbf9] pl-10 pr-3 text-xs outline-none placeholder:text-[#9ba29e]" />
          </label>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <label className="relative shrink-0">
              <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7772]" size={14} />
              <select value={status} onChange={(event) => { const value = event.target.value; setStatus(value); setPage(1); updateUrl(query, value, 1); }} className="focus-ring h-10 appearance-none rounded-xl border border-[#e0e4df] bg-white pl-9 pr-8 text-[11px] font-bold outline-none">
                <option value="all">Todos os retornos</option>
                <option value="overdue">Atrasados</option>
                <option value="today">Hoje</option>
                <option value="scheduled">Agendados</option>
              </select>
            </label>
            <button onClick={() => setModalOpen(true)} className="focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#173f35] px-4 text-[11px] font-bold text-white hover:bg-[#102f28]"><UserRoundPlus size={15} /> Novo cliente</button>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead className="bg-[#fafbf9] text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a928e]"><tr><th className="px-5 py-3">Cliente</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Interesse</th><th className="px-4 py-3">Etapa</th><th className="px-4 py-3">Próximo retorno</th><th className="px-4 py-3">Responsável</th><th className="px-5 py-3" /></tr></thead>
            <tbody className="divide-y divide-[#eef0ed]">
              {pagination.items.map((client) => (
                <tr key={client.id} className="hover:bg-[#fbfcfa]">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#dfe9e4] text-[10px] font-bold text-[#315d50]">{client.initials}</span><div><p className="text-xs font-bold">{client.name}</p><p className="text-[10px] text-[#89918d]">{client.phone}</p></div></div></td>
                  <td className="px-4 py-4 text-xs text-[#616b66]">{client.source}</td>
                  <td className="px-4 py-4"><p className="max-w-[190px] truncate text-xs font-semibold">{client.interest}</p><p className="text-[10px] text-[#8a928e]">{client.propertyCode ?? "Sem imóvel vinculado"}</p></td>
                  <td className="px-4 py-4"><span className="rounded-lg bg-[#f0f2ef] px-2 py-1 text-[10px] font-semibold text-[#59635e]">{client.stage}</span></td>
                  <td className="px-4 py-4"><p className="mb-1 text-[11px] font-bold">{client.nextFollowUp}</p><StatusBadge status={client.followUpStatus} /></td>
                  <td className="px-4 py-4 text-xs text-[#616b66]">{client.responsible}</td>
                  <td className="px-5 py-4"><div className="flex items-center justify-end gap-1"><QuickInteractionButton clientId={client.id} compact /><Link href={`/admin/clientes/${client.id}`} aria-label={`Ver ${client.name}`} className="focus-ring grid size-8 place-items-center rounded-lg text-[#73807a] hover:bg-[#edf2ef] hover:text-[#315d50]"><ChevronRight size={17} /></Link></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[#eceeea] md:hidden">
          {pagination.items.map((client) => <Link key={client.id} href={`/admin/clientes/${client.id}`} className="block p-4"><div className="flex items-start justify-between"><div className="flex gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#dfe9e4] text-[10px] font-bold text-[#315d50]">{client.initials}</span><div><p className="text-sm font-bold">{client.name}</p><p className="text-[11px] text-[#7e8782]">{client.interest}</p></div></div><ChevronRight size={17} /></div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] font-semibold text-[#69736e]">{client.stage}</span><StatusBadge status={client.followUpStatus} /></div></Link>)}
        </div>
        {filtered.length === 0 && <div className="p-12 text-center"><UsersEmpty /><p className="mt-3 text-sm font-bold">{clients.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente encontrado"}</p><p className="mt-1 text-xs text-[#7e8782]">{clients.length === 0 ? "Cadastre o primeiro cliente para iniciar o acompanhamento." : "Tente ajustar a busca ou os filtros."}</p>{clients.length === 0 && <button onClick={() => setModalOpen(true)} className="focus-ring mt-4 rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white">Cadastrar primeiro cliente</button>}</div>}
        <div className="flex items-center justify-between gap-3 border-t border-[#eceeea] px-5 py-3 text-[10px] text-[#828b86]"><span>Mostrando {pagination.items.length} de {filtered.length} resultado(s) · {clients.length} cliente(s)</span>{pagination.totalPages > 1 && <span className="flex items-center gap-2"><button disabled={pagination.currentPage === 1} onClick={() => { const next = pagination.currentPage - 1; setPage(next); updateUrl(query, status, next); }} className="action disabled:opacity-40">Anterior</button><strong>{pagination.currentPage}/{pagination.totalPages}</strong><button disabled={pagination.currentPage === pagination.totalPages} onClick={() => { const next = pagination.currentPage + 1; setPage(next); updateUrl(query, status, next); }} className="action disabled:opacity-40">Próxima</button></span>}</div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#10241f]/55 p-4" role="dialog" aria-modal="true" aria-labelledby="new-client-title">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#eceeea] p-5"><div><h2 id="new-client-title" className="text-lg font-extrabold">Novo cliente</h2><p className="mt-1 text-xs text-[#77817c]">Cadastre os dados essenciais para iniciar o atendimento.</p></div><button onClick={() => setModalOpen(false)} className="focus-ring grid size-8 place-items-center rounded-lg text-[#74807a] hover:bg-[#f0f2ef]" aria-label="Fechar"><X size={18} /></button></div>
            <form onSubmit={addClient} className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Nome completo" name="name" required />
              <Field label="Telefone" name="phone" required />
              <Field label="WhatsApp" name="whatsapp" />
              <Field label="E-mail" name="email" type="email" />
              <SelectField label="Origem" name="source" options={["Site", "Indicação", "Instagram", "WhatsApp", "Outro"]} />
              <SelectField label="Finalidade" name="purpose" options={["Compra", "Aluguel"]} />
              <Field label="Tipo de imóvel" name="propertyType" placeholder="Ex.: Apartamento" />
              <div className="sm:col-span-2"><Field label="Bairros de interesse" name="neighborhoods" placeholder="Separe os bairros por vírgulas" /></div>
              <Field label="Preço mínimo" name="minPrice" type="number" />
              <Field label="Preço máximo" name="maxPrice" type="number" />
              <Field label="Quartos" name="bedrooms" type="number" />
              <div className="sm:col-span-2"><Field label="Observações iniciais" name="note" /></div>
              {error && <p className="text-xs font-semibold text-[#a8443f] sm:col-span-2">{error}</p>}
              <div className="flex justify-end gap-2 border-t border-[#eceeea] pt-4 sm:col-span-2"><button type="button" onClick={() => setModalOpen(false)} className="focus-ring rounded-xl border border-[#dfe3df] px-4 py-2.5 text-xs font-bold">Cancelar</button><button disabled={pending} className="focus-ring rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{pending ? "Salvando..." : "Cadastrar cliente"}</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f7974]">{label}</span><input name={name} type={type} required={required} placeholder={placeholder} className="focus-ring h-10 w-full rounded-xl border border-[#dfe3df] px-3 text-xs outline-none placeholder:text-[#a0a6a3]" /></label>;
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f7974]">{label}</span><select name={name} className="focus-ring h-10 w-full rounded-xl border border-[#dfe3df] bg-white px-3 text-xs outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function UsersEmpty() {
  return <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#edf2ef] text-[#547368]"><Search size={20} /></span>;
}
