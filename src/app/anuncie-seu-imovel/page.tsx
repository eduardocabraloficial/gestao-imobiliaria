import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { PropertySubmissionForm } from "@/components/public/property-submission-form";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = { title: "Anuncie seu imóvel", description: "Envie os dados do seu imóvel para avaliação da Cabral House.", openGraph: { title: "Anuncie seu imóvel | Cabral House", description: "Solicite uma avaliação para venda ou aluguel do seu imóvel.", type: "website" } };

export default function SubmissionPage() { return <main className="min-h-screen bg-[#f7f6f2]"><PublicHeader /><div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:px-8 lg:py-20"><section className="pt-4"><span className="grid size-12 place-items-center rounded-[10px] bg-[#111111] text-[#d6a34d]"><Building2 /></span><p className="mt-8 text-xs font-extrabold uppercase tracking-[0.18em] text-[#795a25]">Venda ou locação</p><h1 className="font-display mt-3 text-5xl leading-tight tracking-[-0.035em]">Anuncie seu imóvel com a Cabral House</h1><p className="mt-5 text-base leading-8 text-[#666666]">Conte um pouco sobre o imóvel. Nossa equipe entrará em contato para conhecer os detalhes e orientar os próximos passos.</p></section><div className="surface rounded-[12px] p-6 sm:p-10"><h2 className="text-xl font-extrabold">Dados do imóvel</h2><p className="mt-2 text-sm text-[#666666]">Preencha as informações essenciais para iniciarmos o atendimento.</p><PropertySubmissionForm /></div></div><PublicFooter /></main>; }
