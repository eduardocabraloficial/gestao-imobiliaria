import { notFound } from "next/navigation";
import { ClientDetail } from "@/components/admin/client-detail";
import { getClientDetail } from "@/lib/data/crm";
import { getClientPropertyInterests } from "@/lib/data/properties";
import { ClientPropertyInterests } from "@/components/admin/client-property-interests";
import { getRelatedScheduling } from "@/lib/data/scheduling";
import { RelatedScheduling } from "@/components/admin/related-scheduling";
import { getStageHistory } from "@/lib/data/phase6";
import { Breadcrumbs } from "@/components/admin/breadcrumbs";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ client, interactions, followUp, demoMode }, propertyData, scheduleData, stageHistory] = await Promise.all([getClientDetail(id), getClientPropertyInterests(id), getRelatedScheduling("client", id), getStageHistory(id)]);
  if (!client) notFound();

  return (
    <>
      <Breadcrumbs items={[{ label: "Clientes", href: "/admin/clientes" }, { label: client.name }]} />
      <ClientDetail client={client} initialInteractions={interactions} followUp={followUp} demoMode={demoMode} />
      <ClientPropertyInterests client={client} initialInterests={propertyData.interests} properties={propertyData.availableProperties} demoMode={propertyData.demoMode} />
      <RelatedScheduling type="client" id={id} appointments={scheduleData.appointments} tasks={scheduleData.tasks} />
      <section className="surface mt-6 rounded-2xl p-5"><h2 className="text-base font-extrabold">Histórico de etapas</h2>{stageHistory.length ? <div className="mt-4 space-y-3">{stageHistory.map((item) => <div key={item.id} className="flex flex-col gap-1 rounded-xl bg-[#f6f7f4] p-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span><strong>{item.previousStage}</strong> → <strong>{item.newStage}</strong></span><time className="text-[10px] text-[#7a837e]">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.changedAt))}</time></div>)}</div> : <p className="mt-3 text-xs text-[#7a837e]">Nenhuma mudança de etapa registrada.</p>}</section>
    </>
  );
}
