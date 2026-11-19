import Link from "next/link";
import { CalendarClock, ChevronRight, Phone, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/admin/property-form";
import { PropertyImagesManager } from "@/components/admin/property-images-manager";
import { RelatedScheduling } from "@/components/admin/related-scheduling";
import { getAdminProperty } from "@/lib/data/properties";
import { getRelatedScheduling } from "@/lib/data/scheduling";
import { Breadcrumbs } from "@/components/admin/breadcrumbs";

export default async function AdminPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ property, interestedClients }, scheduleData] = await Promise.all([getAdminProperty(id), getRelatedScheduling("property", id)]);
  if (!property) notFound();
  return <>
    <Breadcrumbs items={[{ label: "Imóveis", href: "/admin/imoveis" }, { label: property.code }]} />
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a7748]">{property.code} · {property.purpose}</p><h1 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">{property.title}</h1><p className="mt-1 text-xs text-[#7a837e]">{property.neighborhood}, {property.city} · {property.status} · {property.isPublic ? "público" : "privado"}</p></div><strong className="text-xl text-[#173f35]">{currency(property.price)}{property.purpose === "aluguel" && <span className="text-xs font-medium">/mês</span>}</strong></div>
    <PropertyForm property={property} />
    <PropertyImagesManager propertyId={id} images={property.images} />
    <section className="surface mt-6 overflow-hidden rounded-2xl"><div className="border-b border-[#eceeea] px-5 py-5"><div className="flex items-center gap-2"><UsersRound size={17} className="text-[#42675b]" /><h2 className="text-base font-extrabold">Clientes interessados</h2></div></div>{interestedClients.length ? <div className="divide-y divide-[#eceeea]">{interestedClients.map((client) => <Link key={client.id} href={`/admin/clientes/${client.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-[#fbfcfa]"><span className="grid size-9 place-items-center rounded-full bg-[#dfe9e4] text-[10px] font-bold text-[#315d50]">{client.initials}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold">{client.name}</p><div className="mt-1 flex flex-wrap gap-3 text-[10px] text-[#7a837e]"><span className="flex items-center gap-1"><Phone size={11} />{client.phone}</span><span>{client.stage}</span><span className="flex items-center gap-1"><CalendarClock size={11} />{client.nextFollowUp}</span></div></div><ChevronRight size={16} /></Link>)}</div> : <div className="px-5 py-12 text-center"><UsersRound className="mx-auto text-[#84938d]" /><p className="mt-2 text-sm font-bold">Nenhum cliente interessado ainda.</p></div>}</section>
    <RelatedScheduling type="property" id={id} appointments={scheduleData.appointments} tasks={scheduleData.tasks} />
  </>;
}

function currency(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
