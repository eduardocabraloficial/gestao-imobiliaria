import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  TriangleAlert,
  UserRoundPlus,
  UsersRound,
  Building2,
  BookmarkCheck,
  BadgeCheck,
  ClipboardCheck,
  CalendarClock,
  CalendarDays,
  Handshake,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { getDashboardData } from "@/lib/data/crm";
import { QuickInteractionButton } from "@/components/admin/quick-interaction-button";

const metricTone = {
  green: "bg-[#e7f0eb] text-[#356454]",
  gold: "bg-[#fff1db] text-[#9a6b28]",
  red: "bg-[#fae9e7] text-[#b34b45]",
  blue: "bg-[#e8eff6] text-[#476b8d]",
  purple: "bg-[#eeeaf5] text-[#725f91]",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const followUps = data.clients;
  const metrics = [
    { label: "Retornos atrasados", value: String(data.followUpsOverdue), detail: data.followUpsOverdue ? "Requer atenção" : "Tudo em dia", icon: TriangleAlert, tone: "red", href: "/admin/hoje#retornos-atrasados" },
    { label: "Retornos hoje", value: String(data.followUpsToday), detail: "Pendentes para hoje", icon: Clock3, tone: "gold", href: "/admin/hoje#retornos-hoje" },
    { label: "Novos leads", value: String(data.newLeads), detail: "Aguardando contato", icon: UserRoundPlus, tone: "blue", href: "/admin/leads?status=novo" },
    { label: "Pendências atrasadas", value: String(data.overdueTasks), detail: data.overdueTasks ? "Prioridade operacional" : "Tudo em dia", icon: ClipboardCheck, tone: "red", href: "/admin/hoje#pendencias-atrasadas" },
    { label: "Visitas hoje", value: String(data.visitsToday), detail: "Compromissos do dia", icon: CalendarClock, tone: "gold", href: "/admin/agenda#visitas-hoje" },
    { label: "Clientes ativos", value: String(data.clientsActive), detail: "Em acompanhamento", icon: UsersRound, tone: "green", href: "/admin/clientes" },
    { label: "Imóveis disponíveis", value: String(data.propertiesAvailable), detail: "Carteira ativa", icon: Building2, tone: "green", href: "/admin/imoveis" },
    { label: "Em negociação", value: String(data.negotiatingClients), detail: "Oportunidades abertas", icon: Handshake, tone: "purple", href: "/admin/funil" },
    { label: "Próximas visitas", value: String(data.upcomingVisits), detail: "Agenda futura", icon: CalendarDays, tone: "purple", href: "/admin/agenda" },
    { label: "Concluídos no mês", value: String(data.closedThisMonth), detail: "Negócios ganhos", icon: Trophy, tone: "green", href: "/admin/relatorios?period=month" },
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title={`Bom dia, ${data.profileName.split(" ")[0]}`}
        description="Aqui está o que precisa da sua atenção hoje."
        action={<div className="flex flex-wrap gap-2"><QuickInteractionButton /><Link href="/admin/clientes?novo=1" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce2dd] bg-white px-4 py-2.5 text-xs font-bold text-[#315d50]"><UserRoundPlus size={16} /> Novo cliente</Link></div>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principais">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="surface focus-ring rounded-2xl p-4 transition-transform hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#7c8580]">{metric.label}</p>
                <p className="mt-2 text-[28px] font-extrabold leading-none tracking-[-0.04em]">{metric.value}</p>
              </div>
              <span className={`grid size-9 place-items-center rounded-xl ${metricTone[metric.tone]}`}><metric.icon size={17} /></span>
            </div>
            <p className={`mt-3 text-[10px] font-semibold ${metric.tone === "red" ? "text-[#b34b45]" : "text-[#87908b]"}`}>{metric.detail}</p>
          </Link>
        ))}
      </section>

      <section className="mt-3 grid gap-3 sm:grid-cols-3" aria-label="Indicadores de imóveis">
        <PropertyMetric label="Imóveis disponíveis" value={data.propertiesAvailable} icon={Building2} href="/admin/imoveis" />
        <PropertyMetric label="Imóveis reservados" value={data.propertiesReserved} icon={BookmarkCheck} href="/admin/imoveis" />
        <PropertyMetric label="Vendidos ou alugados" value={data.propertiesClosed} icon={BadgeCheck} href="/admin/imoveis" />
      </section>

      <section className="surface mt-6 rounded-2xl p-5"><div className="flex items-center justify-between"><div><h2 className="text-base font-extrabold">Novos interessados</h2><p className="mt-1 text-xs text-[#7a837e]">Contatos mais recentes recebidos pelo portal.</p></div><Link href="/admin/leads" className="text-xs font-bold text-[#315d50]">Ver leads <ArrowRight size={13} className="inline" /></Link></div><div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">{data.recentLeads.map((lead) => <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="min-w-0 rounded-xl border border-[#e7e9e5] p-3 hover:bg-[#fbfcfa]"><p className="text-xs font-extrabold">{lead.name}</p><p className="mt-1 truncate text-[10px] text-[#7a837e]">{lead.propertyCode} · {lead.propertyTitle}</p><p className="mt-2 text-[9px] font-bold uppercase text-[#476b8d]">{lead.status.replaceAll("_", " ")}</p></Link>)}{!data.recentLeads.length && <p className="text-xs text-[#7a837e]">Nenhum interessado recebido ainda.</p>}</div></section>

      <section className="surface mt-6 overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-[#eceeea] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#c4524b]" />
              <h2 className="text-base font-extrabold tracking-[-0.025em]">Clientes que precisam de retorno</h2>
            </div>
            <p className="mt-1 text-xs text-[#7a837e]">Priorize os atrasados e mantenha todos os atendimentos em movimento.</p>
          </div>
          <Link href="/admin/clientes" className="focus-ring flex items-center gap-1 rounded-lg text-xs font-bold text-[#315d50] hover:underline">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead className="bg-[#fafbf9] text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a928e]">
              <tr>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-4 py-3">Imóvel de interesse</th>
                <th className="px-4 py-3">Último contato</th>
                <th className="px-4 py-3">Próximo retorno</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef0ed]">
              {followUps.map((client) => (
                <tr key={client.id} className={client.followUpStatus === "overdue" ? "bg-[#fffafa]" : "hover:bg-[#fbfcfa]"}>
                  <td className="px-5 py-4">
                    <Link href={`/admin/clientes/${client.id}`} className="group flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-full bg-[#dfe9e4] text-[10px] font-bold text-[#315d50]">{client.initials}</span>
                      <span>
                        <span className="block text-xs font-bold group-hover:text-[#315d50]">{client.name}</span>
                        <span className="text-[10px] text-[#89918d]">{client.phone}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-4"><span className="block max-w-[180px] truncate text-xs font-semibold">{client.interest}</span><span className="text-[10px] text-[#8a928e]">{client.propertyCode ?? "Busca personalizada"}</span></td>
                  <td className="px-4 py-4 text-xs text-[#626c67]">{client.lastContact}</td>
                  <td className={`px-4 py-4 text-xs font-bold ${client.followUpStatus === "overdue" ? "text-[#b34b45]" : "text-[#34433d]"}`}>{client.nextFollowUp}<span className="block text-[10px] font-medium opacity-65">às {client.followUpTime}</span></td>
                  <td className="px-4 py-4"><span className="rounded-lg bg-[#f0f2ef] px-2 py-1 text-[10px] font-semibold text-[#59635e]">{client.stage}</span></td>
                  <td className="px-4 py-4"><StatusBadge status={client.followUpStatus} /></td>
                  <td className="px-5 py-4 text-right">
                    <QuickInteractionButton clientId={client.id} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[#eceeea] md:hidden">
          {followUps.map((client) => (
            <Link key={client.id} href={`/admin/clientes/${client.id}`} className={`block p-4 ${client.followUpStatus === "overdue" ? "bg-[#fffafa]" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dfe9e4] text-[10px] font-bold text-[#315d50]">{client.initials}</span><div><p className="text-sm font-bold">{client.name}</p><p className="mt-0.5 text-[11px] text-[#7c8580]">{client.interest}</p></div></div>
                <StatusBadge status={client.followUpStatus} />
              </div>
              <div className="mt-3 flex justify-between text-[11px]"><span className="text-[#7c8580]">Próximo retorno</span><strong className={client.followUpStatus === "overdue" ? "text-[#b34b45]" : ""}>{client.nextFollowUp} · {client.followUpTime}</strong></div>
            </Link>
          ))}
        </div>
        {followUps.length === 0 && (
          <div className="px-5 py-14 text-center">
            <Clock3 className="mx-auto text-[#769086]" size={28} />
            <p className="mt-3 text-sm font-extrabold">Nenhum retorno pendente.</p>
            <p className="mt-1 text-xs text-[#7a837e]">Os próximos retornos cadastrados aparecerão aqui.</p>
          </div>
        )}
      </section>
    </>
  );
}

function PropertyMetric({ label, value, icon: Icon, href }: { label: string; value: number; icon: typeof Building2; href: string }) {
  return <Link href={href} className="surface focus-ring flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-[#fbfcfa]"><span className="grid size-8 place-items-center rounded-lg bg-[#edf2ef] text-[#42675b]"><Icon size={15} /></span><div><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#7c8580]">{label}</p><p className="text-lg font-extrabold">{value}</p></div></Link>;
}
