import { PageHeader } from "@/components/admin/page-header";
import { FunnelBoard } from "@/components/admin/funnel-board";
import { listClients } from "@/lib/data/crm";

export default async function FunnelPage() { const { clients } = await listClients(); return <><PageHeader eyebrow="Comercial" title="Funil de clientes" description="Acompanhe cada oportunidade e mova clientes entre as etapas do atendimento." /><FunnelBoard initial={clients} /></>; }
