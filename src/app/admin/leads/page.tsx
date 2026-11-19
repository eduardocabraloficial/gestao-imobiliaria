import { PageHeader } from "@/components/admin/page-header";
import { LeadsManager } from "@/components/admin/leads-manager";
import { listLeads } from "@/lib/data/leads";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) { const [{ leads }, params] = await Promise.all([listLeads(), searchParams]); return <><PageHeader eyebrow="Portal público" title="Leads" description="Interesses recebidos pelo site, com o imóvel identificado automaticamente." /><LeadsManager leads={leads} initialFilter={params.status} /></>; }
