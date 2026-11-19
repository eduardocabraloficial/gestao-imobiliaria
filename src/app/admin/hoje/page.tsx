import Link from "next/link";
import { CalendarClock, ChevronRight, ClipboardCheck, Clock3, Plus, TriangleAlert, UserRoundPlus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { QuickInteractionButton } from "@/components/admin/quick-interaction-button";
import { getProductivityData } from "@/lib/data/phase7";
import { formatDateTimePtBr } from "@/lib/phase7";
import type { Appointment, Client, Lead, Task } from "@/types";

export default async function TodayPage() {
  const data = await getProductivityData();
  const priorityCount = data.overdueFollowUps.length + data.overdueTasks.length;
  return (
    <>
      <PageHeader
        eyebrow="Central diária"
        title="Hoje"
        description={priorityCount ? `${priorityCount} item(ns) urgente(s) precisam da sua atenção.` : "Sua rotina está organizada. Confira os próximos compromissos."}
        action={<QuickInteractionButton />}
      />

      <section className="mb-5 flex flex-wrap gap-2" aria-label="Ações rápidas">
        <QuickLink href="/admin/clientes?novo=1" label="Novo cliente" />
        <QuickLink href="/admin/imoveis/novo" label="Novo imóvel" />
        <QuickLink href="/admin/agenda?novo=1" label="Agendar visita" />
        <QuickLink href="/admin/pendencias?novo=1" label="Criar pendência" />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ClientSection id="retornos-atrasados" title="Retornos atrasados" tone="urgent" icon={TriangleAlert} items={data.overdueFollowUps} empty="Nenhum retorno atrasado." />
        <TaskSection id="pendencias-atrasadas" title="Pendências atrasadas" tone="urgent" icon={ClipboardCheck} items={data.overdueTasks} empty="Nenhuma pendência atrasada." />
        <ClientSection id="retornos-hoje" title="Retornos de hoje" tone="attention" icon={Clock3} items={data.followUpsToday} empty="Nenhum retorno para hoje." />
        <TaskSection id="pendencias-hoje" title="Pendências de hoje" tone="attention" icon={ClipboardCheck} items={data.tasksToday} empty="Nenhuma pendência para hoje." />
        <VisitSection id="visitas-hoje" items={data.visitsToday} />
        <LeadSection items={data.newLeads} />
        <StaleSection items={data.staleClients} />
      </div>
    </>
  );
}

function Section({ id, title, tone, icon: Icon, children }: { id: string; title: string; tone: "urgent" | "attention" | "normal"; icon: typeof Clock3; children: React.ReactNode }) {
  const toneClass = tone === "urgent" ? "bg-[#fae9e7] text-[#b34b45]" : tone === "attention" ? "bg-[#fff1db] text-[#9a6b28]" : "bg-[#e7f0eb] text-[#356454]";
  return <section id={id} className="surface scroll-mt-24 overflow-hidden rounded-2xl"><div className="flex items-center gap-3 border-b border-[#eceeea] px-5 py-4"><span className={`grid size-9 place-items-center rounded-xl ${toneClass}`}><Icon size={16} /></span><h2 className="text-sm font-extrabold">{title}</h2></div>{children}</section>;
}

function ClientSection({ id, title, tone, icon, items, empty }: { id: string; title: string; tone: "urgent" | "attention"; icon: typeof Clock3; items: Client[]; empty: string }) {
  return <Section id={id} title={title} tone={tone} icon={icon}>{items.length ? <div className="divide-y divide-[#edf0ed]">{items.map((client) => <div key={client.id} className="flex items-center gap-3 px-5 py-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dfe9e4] text-[10px] font-bold text-[#315d50]">{client.initials}</span><div className="min-w-0 flex-1"><Link href={`/admin/clientes/${client.id}`} className="text-xs font-extrabold hover:text-[#315d50]">{client.name}</Link><p className="truncate text-[10px] text-[#7a837e]">{client.nextFollowUp} às {client.followUpTime} · {client.interest}</p></div><QuickInteractionButton clientId={client.id} compact /></div>)}</div> : <Empty text={empty} />}</Section>;
}

function TaskSection({ id, title, tone, icon, items, empty }: { id: string; title: string; tone: "urgent" | "attention"; icon: typeof Clock3; items: Task[]; empty: string }) {
  return <Section id={id} title={title} tone={tone} icon={icon}>{items.length ? <div className="divide-y divide-[#edf0ed]">{items.map((task) => <Link key={task.id} href={`/admin/pendencias?status=${task.temporalStatus}`} className="flex items-center gap-3 px-5 py-4 hover:bg-[#fafbf9]"><div className="min-w-0 flex-1"><p className="text-xs font-extrabold">{task.title}</p><p className="text-[10px] text-[#7a837e]">{formatDateTimePtBr(task.dueAt)}{task.clientName ? ` · ${task.clientName}` : ""}</p></div><ChevronRight size={15} /></Link>)}</div> : <Empty text={empty} />}</Section>;
}

function VisitSection({ id, items }: { id: string; items: Appointment[] }) {
  return <Section id={id} title="Visitas de hoje" tone="attention" icon={CalendarClock}>{items.length ? <div className="divide-y divide-[#edf0ed]">{items.map((visit) => <Link key={visit.id} href="/admin/agenda" className="flex items-center gap-3 px-5 py-4 hover:bg-[#fafbf9]"><div className="min-w-0 flex-1"><p className="text-xs font-extrabold">{visit.clientName}</p><p className="text-[10px] text-[#7a837e]">{formatDateTimePtBr(visit.scheduledAt)} · {visit.propertyCode}</p></div><ChevronRight size={15} /></Link>)}</div> : <Empty text="Nenhuma visita agendada para hoje." />}</Section>;
}

function LeadSection({ items }: { items: Lead[] }) {
  return <Section id="novos-leads" title="Novos leads" tone="normal" icon={UserRoundPlus}>{items.length ? <div className="divide-y divide-[#edf0ed]">{items.map((lead) => <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-[#fafbf9]"><div className="min-w-0 flex-1"><p className="text-xs font-extrabold">{lead.name}</p><p className="text-[10px] text-[#7a837e]">{lead.phone} · {lead.propertyCode}</p></div><ChevronRight size={15} /></Link>)}</div> : <Empty text="Nenhum lead novo." />}</Section>;
}

function StaleSection({ items }: { items: Array<Client & { daysWithoutContact: number }> }) {
  return <Section id="clientes-sem-contato" title="Clientes sem interação recente" tone="normal" icon={UsersRound}>{items.length ? <div className="divide-y divide-[#edf0ed]">{items.map((client) => <div key={client.id} className="flex items-center gap-3 px-5 py-4"><div className="min-w-0 flex-1"><Link href={`/admin/clientes/${client.id}`} className="text-xs font-extrabold hover:text-[#315d50]">{client.name}</Link><p className="text-[10px] font-semibold text-[#9a6b28]">Sem contato há {client.daysWithoutContact} dias</p></div><QuickInteractionButton clientId={client.id} compact /></div>)}</div> : <Empty text="Nenhum cliente está sem contato há 7 dias." />}</Section>;
}

function QuickLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-[#dfe4df] bg-white px-3 py-2 text-[10px] font-bold text-[#315d50]"><Plus size={13} /> {label}</Link>; }
function Empty({ text }: { text: string }) { return <p className="px-5 py-8 text-center text-xs text-[#7a837e]">{text}</p>; }
