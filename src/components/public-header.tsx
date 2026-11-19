"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, MessageCircle, X } from "lucide-react";
import { Brand } from "@/components/brand";

const links = [{ label: "Início", href: "/" }, { label: "Imóveis", href: "/imoveis" }, { label: "Comprar", href: "/imoveis?purpose=venda" }, { label: "Alugar", href: "/imoveis?purpose=aluguel" }, { label: "Anuncie seu imóvel", href: "/anuncie-seu-imovel" }, { label: "Contato", href: "/#contato" }];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <header className="sticky inset-x-0 top-0 z-40 border-b border-[#e7e4dd] bg-white/95 text-[#111111] backdrop-blur"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8"><Brand /><nav className="hidden items-center gap-6 lg:flex">{links.map((link) => { const basePath = link.href.split("?")[0].split("#")[0]; const active = link.label === "Início" ? pathname === "/" : link.label !== "Contato" && pathname.startsWith(basePath); return <Link key={link.label} href={link.href} className={`focus-ring relative rounded-md py-2 text-[11px] font-bold transition-colors ${active ? "text-[#111111] after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-[#d6a34d]" : "text-[#666666] hover:text-[#111111]"}`}>{link.label}</Link>; })}</nav><div className="flex items-center gap-2"><Link href="/login" className="focus-ring hidden rounded-[10px] bg-[#111111] px-4 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-[#202021] sm:block">Área do Corretor</Link><a href="https://wa.me/5500000000000" aria-label="Falar pelo WhatsApp" className="focus-ring hidden size-10 items-center justify-center rounded-[10px] border border-[#e7e4dd] text-[#795a25] transition-colors hover:border-[#d6a34d] sm:flex"><MessageCircle size={16} /></a><button onClick={() => setOpen((value) => !value)} className="focus-ring grid size-10 place-items-center rounded-[10px] border border-[#e7e4dd] lg:hidden" aria-label="Menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button></div></div>{open && <nav className="border-t border-[#e7e4dd] bg-white px-5 py-3 shadow-[0_18px_35px_rgba(17,17,17,.08)] lg:hidden">{links.map((link) => <Link key={link.label} href={link.href} onClick={() => setOpen(false)} className="block border-b border-[#f0eee8] py-3 text-sm font-semibold text-[#555] last:border-0">{link.label}</Link>)}<Link href="/login" onClick={() => setOpen(false)} className="mt-3 block rounded-[10px] bg-[#111111] px-4 py-3 text-center text-sm font-bold text-white">Área do Corretor</Link></nav>}</header>;
}
