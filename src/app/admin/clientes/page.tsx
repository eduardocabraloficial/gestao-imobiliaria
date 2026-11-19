import { ClientsManager } from "@/components/admin/clients-manager";
import { PageHeader } from "@/components/admin/page-header";
import { listClients } from "@/lib/data/crm";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ novo?: string; q?: string; status?: string; page?: string }> }) {
  const params = await searchParams;
  const { clients, demoMode } = await listClients();
  return (
    <>
      <PageHeader eyebrow="Relacionamento" title="Clientes" description="Acompanhe cada oportunidade, contato e próximo passo em um só lugar." />
      <ClientsManager initialClients={clients} openOnLoad={params.novo === "1"} demoMode={demoMode} initialQuery={params.q ?? ""} initialStatus={params.status ?? "all"} initialPage={Math.max(1, Number(params.page) || 1)} />
    </>
  );
}
