import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#f6f7f4] p-6"><div className="surface max-w-md rounded-2xl p-10 text-center"><SearchX className="mx-auto text-[#547368]" size={36} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a7748]">Erro 404</p><h1 className="mt-2 text-2xl font-extrabold">Registro não encontrado</h1><p className="mt-2 text-sm text-[#6f7974]">O conteúdo pode ter sido removido ou o endereço está incorreto.</p><Link href="/admin" className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white"><ArrowLeft size={14} /> Voltar ao painel</Link></div></main>;
}
