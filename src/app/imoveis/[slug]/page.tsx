import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, CarFront, Check, ImageOff, MapPin, Maximize2, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { InterestForm } from "@/components/public/interest-form";
import { getPublicProperty } from "@/lib/data/properties";
import { normalizeImageSource, validImageSources } from "@/lib/images";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await getPublicProperty((await params).slug);
  if (!property) return { title: "Imóvel não encontrado" };
  const title = `${property.title} em ${property.neighborhood} | ${property.purpose}`;
  const image = normalizeImageSource(property.image);
  return { title, description: property.description.slice(0, 155), openGraph: { title, description: property.description.slice(0, 155), images: image ? [image] : undefined, type: "website" } };
}

export default async function PropertyPage({ params }: Props) {
  const property = await getPublicProperty((await params).slug);
  if (!property) notFound();
  const gallery = Array.from(new Set(validImageSources([
    ...property.images.map((item) => item.url),
    property.image,
  ])));
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5500000000000").replace(/\D/g, "");
  const text = encodeURIComponent(`Olá, tenho interesse no imóvel ${property.code} — ${property.title}.`);

  return <main className="min-h-screen bg-[#f7f6f2]">
    <PublicHeader />
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <Link href="/imoveis" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-[#555555] hover:text-[#111111]"><ArrowLeft size={15} /> Voltar aos imóveis</Link>
      {gallery.length > 0 ? <div className="mt-6 grid gap-3 md:grid-cols-2">{gallery.slice(0, 4).map((src, index) => <div key={src} className={`relative overflow-hidden rounded-[12px] bg-[#e7e4dd] ${index === 0 ? "aspect-[16/10] md:row-span-2" : "aspect-[16/8]"}`}><Image src={src} alt={`${property.title} — imagem ${index + 1}`} fill loading={index === 0 ? "eager" : "lazy"} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>)}</div> : <div className="mt-6 grid min-h-[320px] place-items-center rounded-[12px] border border-[#e7e4dd] bg-[#eeeae2] px-6 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-[10px] bg-white text-[#795a25]"><ImageOff size={21} /></span><p className="mt-4 text-sm font-extrabold text-[#111111]">Imóvel sem imagens cadastradas</p></div></div>}
      <div className="grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
        <section><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#795a25]">{property.code} · {property.purpose}</p><h1 className="font-display mt-3 text-4xl tracking-[-0.035em] sm:text-5xl">{property.title}</h1><p className="mt-4 flex items-center gap-2 text-base text-[#666666]"><MapPin size={17} />{property.neighborhood}, {property.city}</p><div className="mt-7 flex flex-wrap gap-6 border-y border-[#e7e4dd] py-5 text-sm font-bold text-[#444444]"><span className="flex gap-2"><Maximize2 size={18} />{property.area} m²</span><span className="flex gap-2"><BedDouble size={18} />{property.bedrooms} quartos</span><span className="flex gap-2"><Bath size={18} />{property.suites} suítes · {property.bathrooms} banheiros</span><span className="flex gap-2"><CarFront size={18} />{property.parking} vagas</span></div><h2 className="mt-10 text-lg font-extrabold">Sobre este imóvel</h2><p className="mt-4 max-w-3xl text-base leading-8 text-[#666666]">{property.description}</p>{property.characteristics.length > 0 && <><h2 className="mt-10 text-lg font-extrabold">Características</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{property.characteristics.map((item) => <li key={item} className="flex items-center gap-2 text-sm text-[#555555]"><Check size={16} className="text-[#795a25]" />{item}</li>)}</ul></>}</section>
        <aside className="surface h-fit rounded-[12px] p-6 lg:sticky lg:top-24"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#666666]">Valor</p><p className="mt-2 text-3xl font-extrabold text-[#111111]">{property.price}</p><dl className="mt-4 space-y-2 border-b border-[#e7e4dd] pb-5 text-sm text-[#666666]">{property.condominiumFee !== null && <div className="flex justify-between"><dt>Condomínio</dt><dd>{money(property.condominiumFee)}</dd></div>}{property.iptu !== null && <div className="flex justify-between"><dt>IPTU</dt><dd>{money(property.iptu)}</dd></div>}</dl><InterestForm slug={property.slug} code={property.code} /><a href={`https://wa.me/${whatsapp}?text=${text}`} target="_blank" rel="noreferrer" className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#111111] px-4 py-3 text-sm font-bold text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"><MessageCircle size={16} /> Falar pelo WhatsApp</a></aside>
      </div>
    </div>
    <PublicFooter />
  </main>;
}

function money(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
