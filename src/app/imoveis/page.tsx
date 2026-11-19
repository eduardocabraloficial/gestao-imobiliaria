import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PropertyCard } from "@/components/property-card";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { listPublicProperties } from "@/lib/data/properties";

export const metadata: Metadata = { title: "Imóveis para comprar e alugar", description: "Consulte imóveis selecionados para venda e aluguel.", openGraph: { title: "Imóveis | Cabral House", description: "Encontre imóveis para comprar ou alugar.", type: "website" } };

type Search = Record<string, string | string[] | undefined>;
const value = (params: Search, key: string) => typeof params[key] === "string" ? params[key] as string : "";
const number = (raw: string) => raw && Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null;

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const homePurpose = value(params, "finalidade");
  const purpose = value(params, "purpose") || (homePurpose === "Comprar" ? "venda" : homePurpose === "Alugar" ? "aluguel" : "");
  const local = value(params, "local");
  const rawNeighborhood = value(params, "neighborhood");
  const inferredCity = value(params, "city") || local || (["São Paulo", "Barueri", "Campinas"].includes(rawNeighborhood) ? rawNeighborhood : "");
  const properties = await listPublicProperties({ purpose, propertyType: value(params, "type") || value(params, "tipo"), neighborhood: inferredCity === rawNeighborhood ? "" : rawNeighborhood, city: inferredCity, minPrice: number(value(params, "minPrice")), maxPrice: number(value(params, "maxPrice")), bedrooms: number(value(params, "bedrooms")), code: value(params, "code"), sort: value(params, "sort") });
  return <main className="min-h-screen bg-[#f7f6f2]"><PublicHeader /><section className="border-b border-[#e7e4dd] bg-white"><div className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#795a25]">Nosso portfólio</p><h1 className="font-display mt-3 text-5xl tracking-[-0.035em]">Imóveis selecionados</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#666666]">Explore oportunidades para comprar ou alugar e refine sua busca pelos critérios mais importantes.</p></div></section><section className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><form className="surface grid gap-3 rounded-[12px] p-4 sm:grid-cols-2 lg:grid-cols-4"><Select name="purpose" label="Finalidade" defaultValue={purpose} options={[["","Venda ou aluguel"],["venda","Venda"],["aluguel","Aluguel"]]} /><Input name="type" label="Tipo" defaultValue={value(params,"type") || value(params,"tipo")} /><Input name="neighborhood" label="Bairro" defaultValue={value(params,"neighborhood") || local} /><Input name="city" label="Cidade" defaultValue={value(params,"city")} /><Input name="minPrice" label="Preço mínimo" type="number" defaultValue={value(params,"minPrice")} /><Input name="maxPrice" label="Preço máximo" type="number" defaultValue={value(params,"maxPrice")} /><Input name="bedrooms" label="Quartos (mínimo)" type="number" defaultValue={value(params,"bedrooms")} /><Input name="code" label="Código" defaultValue={value(params,"code")} /><Select name="sort" label="Ordenar" defaultValue={value(params,"sort")} options={[["","Mais recentes"],["price_asc","Menor preço"],["price_desc","Maior preço"]]} /><button className="focus-ring inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#111111] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#202021] lg:col-span-3"><Search size={16} /> Buscar imóveis</button></form><p className="mt-8 text-sm font-semibold text-[#666666]">{properties.length} imóvel(is) encontrado(s)</p><div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{properties.map((property, index) => <PropertyCard key={property.id} property={property} priority={index === 0} />)}</div>{!properties.length && <div className="surface mt-6 rounded-[12px] py-16 text-center"><p className="text-base font-extrabold">Nenhum imóvel encontrado.</p><p className="mt-2 text-sm text-[#666666]">Tente remover alguns filtros para ampliar os resultados.</p><Link href="/imoveis" className="mt-4 inline-block text-sm font-bold text-[#795a25]">Limpar filtros</Link></div>}</section><PublicFooter /></main>;
}
function Input({ name, label, type = "text", defaultValue }: { name: string; label: string; type?: string; defaultValue: string }) { return <label><span className="sr-only">{label}</span><input name={name} type={type} min={type === "number" ? 0 : undefined} defaultValue={defaultValue} placeholder={label} className="field" /></label>; }
function Select({ name, label, options, defaultValue }: { name: string; label: string; options: string[][]; defaultValue: string }) { return <label><span className="sr-only">{label}</span><select name={name} defaultValue={defaultValue} className="field">{options.map(([key,text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
