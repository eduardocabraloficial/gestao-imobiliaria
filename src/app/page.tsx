import Image from "next/image";
import Link from "next/link";
import { Building2, CheckCircle2, Handshake, Headphones, ImageOff, MapPinned, Search, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { PropertyCard } from "@/components/property-card";
import { listPublicProperties } from "@/lib/data/properties";
import { normalizeImageSource } from "@/lib/images";

export const revalidate = 60;

export default async function HomePage() {
  const available = await listPublicProperties();
  const featured = available.filter((item) => item.featured);
  const properties = (featured.length ? featured : available).slice(0, 3);
  const heroImage = normalizeImageSource(properties[0]?.image);
  const institutionalImage = normalizeImageSource(properties[1]?.image);

  return <main className="bg-[#f7f6f2] text-[#111111]">
    <PublicHeader />
    <section className="overflow-hidden bg-white">
      <div className="mx-auto grid min-h-[620px] max-w-7xl items-stretch lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex flex-col justify-center px-5 py-16 sm:px-10 lg:px-8 lg:py-24 xl:pr-20">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#795a25]">Imóveis selecionados • Maceió e região</p>
          <h1 className="font-display mt-5 max-w-2xl text-balance text-5xl leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[68px]">Encontre o imóvel ideal para o seu próximo capítulo.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#666666]">Compra, venda e locação com atendimento próximo e imóveis selecionados para você.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/imoveis" className="focus-ring inline-flex items-center justify-center rounded-[10px] bg-[#111111] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#202021]">Encontrar imóveis</Link><a href="https://wa.me/5500000000000" className="focus-ring inline-flex items-center justify-center rounded-[10px] border border-[#111111] px-6 py-3.5 text-sm font-bold text-[#111111] transition-colors hover:bg-[#f7f6f2]">Falar com um corretor</a></div>
        </div>
        <div className="relative min-h-[420px] bg-[#202021] lg:min-h-full">{heroImage ? <Image src={heroImage} alt="Imóvel contemporâneo selecionado pela Cabral House" fill loading="eager" sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /> : <ImagePlaceholder inverted />}<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" /><div className="absolute bottom-6 left-6 border-l-2 border-[#d6a34d] bg-black/70 px-4 py-3 text-white backdrop-blur"><p className="text-xs font-bold uppercase tracking-[0.15em]">Cabral House</p><p className="mt-1 text-xs text-white/65">Seleção, clareza e acompanhamento</p></div></div>
      </div>
    </section>

    <section className="relative z-10 mx-auto -mt-6 max-w-7xl px-5 lg:px-8">
      <form action="/imoveis" className="grid gap-2 rounded-[12px] border border-[#e7e4dd] bg-white p-3 shadow-[0_18px_45px_rgba(17,17,17,.08)] sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1fr_1fr_auto]">
        <SearchField label="Finalidade" name="purpose" options={[["venda", "Comprar"], ["aluguel", "Alugar"]]} />
        <SearchField label="Localização" name="local" options={[["Maceió", "Maceió"], ["São Paulo", "São Paulo"], ["Barueri", "Barueri"], ["Campinas", "Campinas"]]} />
        <SearchField label="Tipo de imóvel" name="type" options={[["Apartamento", "Apartamento"], ["Casa", "Casa"], ["Studio", "Studio"], ["Cobertura", "Cobertura"]]} />
        <SearchField label="Faixa de preço" name="maxPrice" options={[["500000", "Até R$ 500 mil"], ["1000000", "Até R$ 1 milhão"], ["2000000", "Até R$ 2 milhões"]]} />
        <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#d6a34d] px-6 py-3 text-sm font-extrabold text-[#111111] transition-colors hover:bg-[#e3aa43]"><Search size={17} /> Buscar</button>
      </form>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#795a25]">Imóveis em destaque</p><h2 className="font-display mt-3 text-4xl tracking-[-0.025em] sm:text-5xl">Oportunidades selecionadas para você</h2><p className="mt-4 text-base leading-7 text-[#666666]">Uma seleção objetiva para facilitar sua busca e tornar cada visita mais relevante.</p></div><div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{properties.map((property, index) => <PropertyCard key={property.id} property={property} priority={index === 0} />)}</div>{!properties.length && <div className="mt-10 rounded-[12px] border border-[#e7e4dd] bg-white py-14 text-center"><p className="text-sm font-bold">Os imóveis em destaque aparecerão aqui.</p></div>}<div className="mt-8 text-center"><Link href="/imoveis" className="focus-ring inline-flex rounded-[10px] border border-[#111111] px-5 py-3 text-sm font-bold">Ver todos os imóveis</Link></div></section>

    <section className="border-y border-[#e7e4dd] bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:grid-cols-2 lg:grid-cols-4 lg:px-8"><Benefit icon={CheckCircle2} title="Imóveis selecionados" text="Portfólio organizado e atualizado." /><Benefit icon={Headphones} title="Atendimento personalizado" text="Acompanhamento em cada etapa." /><Benefit icon={ShieldCheck} title="Negociação segura" text="Mais clareza durante todo o processo." /><Benefit icon={MapPinned} title="Conhecimento local" text="Atuação próxima ao mercado imobiliário da região." /></div></section>

    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-24 lg:grid-cols-2 lg:items-center lg:px-8"><div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[#eeeae2]">{institutionalImage ? <Image src={institutionalImage} alt="Interior de imóvel selecionado" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /> : <ImagePlaceholder />}</div><div className="lg:pl-10"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#795a25]">Atendimento próximo</p><h2 className="font-display mt-3 text-4xl leading-tight tracking-[-0.025em] sm:text-5xl">Mais que imóveis. Acompanhamos cada etapa da sua escolha.</h2><p className="mt-5 text-base leading-8 text-[#666666]">Organizamos sua busca, apresentamos alternativas coerentes e acompanhamos as decisões de compra, venda ou locação com clareza.</p><div className="mt-6 flex items-center gap-3 text-sm font-bold"><Handshake className="text-[#795a25]" /> Confiança para decidir no seu ritmo.</div></div></section>

    <section className="bg-[#111111] text-white"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#d6a34d]">Venda ou locação</p><h2 className="font-display mt-3 text-4xl">Tem um imóvel para vender ou alugar?</h2><p className="mt-3 text-base text-white/60">Apresente seu imóvel para a Cabral House.</p></div><Link href="/anuncie-seu-imovel" className="focus-ring inline-flex items-center justify-center gap-2 self-start rounded-[10px] bg-[#d6a34d] px-6 py-3.5 text-sm font-extrabold text-[#111111] transition-colors hover:bg-[#e3aa43]"><Building2 size={17} /> Anunciar meu imóvel</Link></div></section>
    <PublicFooter />
  </main>;
}

function SearchField({ label, name, options }: { label: string; name: string; options: string[][] }) { return <label className="px-3 py-2 lg:border-r lg:border-[#e7e4dd]"><span className="block text-xs font-bold text-[#666666]">{label}</span><select name={name} aria-label={label} className="mt-1 w-full bg-transparent text-sm font-extrabold text-[#111111] outline-none"><option value="">Todos</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>; }
function Benefit({ icon: Icon, title, text }: { icon: typeof Headphones; title: string; text: string }) { return <div><span className="grid size-11 place-items-center rounded-[10px] border border-[#e7e4dd] text-[#795a25]"><Icon size={20} strokeWidth={1.7} /></span><h3 className="mt-5 text-base font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#666666]">{text}</p></div>; }
function ImagePlaceholder({ inverted = false }: { inverted?: boolean }) { return <div className={`absolute inset-0 grid place-items-center text-center ${inverted ? "text-white/65" : "text-[#795a25]"}`}><div><ImageOff className="mx-auto" size={28} /><p className="mt-3 text-sm font-bold">Imóvel sem imagens cadastradas</p></div></div>; }
