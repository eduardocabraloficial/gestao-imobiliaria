import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PropertiesManager } from "@/components/admin/properties-manager";
import { listAdminProperties } from "@/lib/data/properties";

export default async function AdminPropertiesPage() {
  const { properties } = await listAdminProperties();
  return <><PageHeader eyebrow="Carteira" title="Imóveis" description="Cadastre, organize e acompanhe a disponibilidade da sua carteira." action={<Link href="/admin/imoveis/novo" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white"><Plus size={15} /> Novo imóvel</Link>} /><PropertiesManager initialProperties={properties} /></>;
}
