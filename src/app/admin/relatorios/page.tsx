import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { getReportData } from "@/lib/data/phase6";
import type { PeriodPreset } from "@/lib/phase6";

const presets = new Set(["today", "7d", "30d", "month", "custom"]);

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawPeriod = typeof params.period === "string" ? params.period : "30d";
  const period = (presets.has(rawPeriod) ? rawPeriod : "30d") as PeriodPreset;
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;
  const data = await getReportData(period, from, to);
  const noData = data.clients.total === 0 && data.leads.total === 0
    && data.interactions.total === 0 && data.visits.total === 0;

  return (
    <>
      <PageHeader
        eyebrow="Indicadores"
        title="Relatórios"
        description="Visão comercial e operacional com filtros por período."
      />

      <form className="surface mb-5 flex flex-wrap items-end gap-3 rounded-2xl p-4">
        <label>
          <span className="mb-1 block text-[9px] font-bold uppercase">Período</span>
          <select name="period" defaultValue={period} className="field">
            <option value="today">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="month">Este mês</option>
            <option value="custom">Personalizado</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[9px] font-bold uppercase">De</span>
          <input name="from" type="date" defaultValue={from} className="field" />
        </label>
        <label>
          <span className="mb-1 block text-[9px] font-bold uppercase">Até</span>
          <input name="to" type="date" defaultValue={to} className="field" />
        </label>
        <button className="h-10 rounded-xl bg-[#173f35] px-4 text-xs font-bold text-white">Aplicar</button>
      </form>

      {noData && (
        <p className="surface mb-5 rounded-2xl p-6 text-sm text-[#66716c]">
          Não há dados suficientes para este período.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Report
          title="Clientes"
          metrics={[["Total", data.clients.total], ["Novos", data.clients.new], ["Ativos", data.clients.active], ["Concluídos", data.clients.closed], ["Perdidos", data.clients.lost], ["Conversão", `${data.clients.conversion}%`]]}
          chart={data.clients.stages}
        />
        <Report
          title="Leads"
          metrics={[["Recebidos", data.leads.total], ["Novos", data.leads.new], ["Em atendimento", data.leads.attending], ["Convertidos", data.leads.converted], ["Descartados", data.leads.discarded], ["Conversão", `${data.leads.conversion}%`]]}
        />
        <Report
          title="Atendimentos"
          metrics={[["Interações", data.interactions.total], ...data.interactions.byType.map((item) => [item.label, item.value] as [string, number])]}
          chart={data.interactions.byType}
        />
        <Report title="Retornos" metrics={[["Agendados", data.followUps.scheduled], ["Concluídos", data.followUps.completed], ["Atrasados", data.followUps.overdue], ["No prazo", data.followUps.onTime]]} />
        <Report title="Visitas" metrics={[["Agendadas", data.visits.scheduled], ["Realizadas", data.visits.completed], ["Canceladas", data.visits.canceled], ["Reagendadas", data.visits.rescheduled]]} />
        <Report title="Imóveis" metrics={[["Disponíveis", data.properties.available], ["Reservados", data.properties.reserved], ["Vendidos", data.properties.sold], ["Alugados", data.properties.rented], ["Inativos", data.properties.inactive]]} />
        <Report title="Imóveis mais demonstrados" metrics={[]} chart={data.properties.topInterested} empty="Nenhum interesse registrado no período." />
        <Report title="Imóveis mais visitados" metrics={[]} chart={data.properties.topVisited} empty="Nenhuma visita registrada no período." />
      </div>

      <section className="surface mt-5 rounded-2xl p-5">
        <h2 className="text-base font-extrabold">Exportar CSV</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {["clientes", "leads", "imoveis", "visitas", "pendencias"].map((item) => (
            <Link key={item} href={`/admin/relatorios/export/${item}`} className="action capitalize">
              <Download size={13} />
              {item}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Report({
  title,
  metrics,
  chart,
  empty,
}: {
  title: string;
  metrics: Array<[string, string | number]>;
  chart?: Array<{ label: string; value: number }>;
  empty?: string;
}) {
  const max = Math.max(1, ...(chart ?? []).map((item) => item.value));
  return (
    <section className="surface rounded-2xl p-5">
      <h2 className="text-base font-extrabold">{title}</h2>
      {metrics.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[#f6f7f4] p-3">
              <p className="text-[9px] font-bold uppercase text-[#7a837e]">{label}</p>
              <p className="mt-1 text-xl font-extrabold">{value}</p>
            </div>
          ))}
        </div>
      )}
      {chart && chart.length > 0 ? (
        <div className="mt-5 space-y-2">
          {chart.map((item) => (
            <div key={item.label} className="grid grid-cols-[110px_1fr_24px] items-center gap-2 text-[9px]">
              <span className="truncate capitalize">{item.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-[#e7ebe8]">
                <span className="block h-full rounded-full bg-[#42675b]" style={{ width: `${item.value / max * 100}%` }} />
              </span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      ) : chart ? (
        <p className="mt-4 text-xs text-[#66716c]">{empty ?? "Não há dados suficientes para este período."}</p>
      ) : null}
    </section>
  );
}
