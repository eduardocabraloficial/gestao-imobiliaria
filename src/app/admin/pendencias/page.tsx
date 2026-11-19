import { PageHeader } from "@/components/admin/page-header";
import { TasksManager } from "@/components/admin/tasks-manager";
import { getSchedulingData } from "@/lib/data/scheduling";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ client?: string; property?: string; novo?: string; status?: string }> }) {
  const [data, params] = await Promise.all([getSchedulingData(), searchParams]);
  return <><PageHeader eyebrow="Organização" title="Pendências" description="Priorize tarefas atrasadas e mantenha os próximos passos sob controle." /><TasksManager initialTasks={data.tasks} clients={data.clients} properties={data.properties} demoMode={data.demoMode} initialClientId={params.client} initialPropertyId={params.property} openOnLoad={params.novo === "1"} initialStatusFilter={params.status} /></>;
}
