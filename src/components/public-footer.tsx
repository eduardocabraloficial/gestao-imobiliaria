import Link from "next/link";
import { Brand } from "@/components/brand";

export function PublicFooter() {
  return <footer id="contato" className="bg-[#111111] text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.35fr_1fr_1fr] lg:px-8">
      <div><Brand light /><p className="mt-5 max-w-sm text-sm leading-7 text-white/55">Compra, venda e locação com atendimento próximo e imóveis selecionados em Maceió e região.</p></div>
      <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#d6a34d]">Links rápidos</p><nav className="mt-4 grid gap-3 text-sm text-white/65"><Link href="/imoveis">Imóveis</Link><Link href="/imoveis?purpose=venda">Comprar</Link><Link href="/imoveis?purpose=aluguel">Alugar</Link><Link href="/anuncie-seu-imovel">Anuncie seu imóvel</Link><Link href="/login">Área do corretor</Link></nav></div>
      <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#d6a34d]">Contato</p><div className="mt-4 space-y-3 text-sm leading-6 text-white/65"><p>Telefone e WhatsApp disponíveis no atendimento.</p><p>Endereço e CRECI serão publicados após a configuração institucional.</p><p>Instagram: a definir</p></div></div>
    </div>
    <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>© {new Date().getFullYear()} Cabral House Negócios Imobiliários.</p><span>Política de privacidade em preparação.</span></div></div>
  </footer>;
}
