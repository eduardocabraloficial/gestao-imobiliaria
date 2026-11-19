import { PageHeader } from "@/components/admin/page-header";
import { AgendaManager } from "@/components/admin/agenda-manager";
import { getSchedulingData } from "@/lib/data/scheduling";

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ client?: string; novo?: string }> }) {
  const [data, params] = await Promise.all([getSchedulingData(), searchParams]);
  return <><PageHeader eyebrow="Organização" title="Agenda de visitas" description="Acompanhe próximas visitas, compromissos de hoje e histórico." /><AgendaManager initialAppointments={data.appointments} clients={data.clients} properties={data.properties} interests={data.interests} demoMode={data.demoMode} initialClientId={params.client} openOnLoad={params.novo === "1"} /></>;
}
