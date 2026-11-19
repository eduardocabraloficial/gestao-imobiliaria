import { PageHeader } from "@/components/admin/page-header";
import { SubmissionsManager } from "@/components/admin/submissions-manager";
import { listPropertySubmissions } from "@/lib/data/submissions";

export default async function CaptacoesPage() { const { submissions } = await listPropertySubmissions(); return <><PageHeader eyebrow="Proprietários" title="Captações" description="Imóveis enviados pelo portal para avaliação da equipe." /><SubmissionsManager initial={submissions} /></>; }
