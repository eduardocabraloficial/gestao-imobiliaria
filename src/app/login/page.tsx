import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { isDemoModeEnabled } from "@/lib/supabase/server";

export default function LoginPage() {
  const demoMode = isDemoModeEnabled();
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-[#111111] p-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(135deg, transparent 50%, rgba(214,163,77,.18) 100%), radial-gradient(circle at 10% 10%, rgba(214,163,77,.18) 0, transparent 25%)" }} />
        <div className="relative z-10"><Brand light /></div>
        <div className="relative z-10 my-auto max-w-xl"><p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#d6a34d]">CRM Cabral House</p><h1 className="font-display text-5xl leading-[1.08] tracking-[-0.035em]">Nenhuma oportunidade pode ficar para trás.</h1><p className="mt-6 max-w-lg text-base leading-8 text-white/60">Organize seus atendimentos, acompanhe cada retorno e mantenha a operação comercial em movimento.</p><div className="mt-10 grid gap-4 sm:grid-cols-2"><Feature text="Retornos priorizados" /><Feature text="Histórico centralizado" /><Feature text="Funil de atendimento" /><Feature text="Imóveis vinculados" /></div></div>
        <p className="relative z-10 text-xs text-white/35">Cabral House · Ambiente administrativo seguro</p>
      </section>
      <section className="flex items-center justify-center bg-[#f7f6f2] p-5 sm:p-10">
        <div className="w-full max-w-[410px]">
          <div className="mb-10 flex items-center justify-between lg:hidden"><Brand /><Link href="/" className="focus-ring rounded-lg text-xs font-bold text-[#52625b]">Voltar ao site</Link></div>
          <Link href="/" className="focus-ring mb-8 hidden items-center gap-1.5 rounded-lg text-[11px] font-bold text-[#68756f] hover:text-[#315d50] lg:inline-flex"><ArrowLeft size={14} /> Voltar ao portal</Link>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#795a25]">Área restrita</p><h2 className="font-display mt-2 text-4xl tracking-[-0.035em]">Bem-vindo de volta</h2><p className="mt-3 text-base leading-7 text-[#666666]">Acesse sua conta para acompanhar clientes e oportunidades.</p>
          <Suspense><LoginForm demoMode={demoMode} /></Suspense>
          <p className="mt-8 text-center text-[10px] text-[#929a96]">Acesso exclusivo para usuários autorizados.</p>
        </div>
      </section>
    </main>
  );
}

function Feature({ text }: { text: string }) { return <div className="flex items-center gap-2 text-sm font-semibold text-white/70"><CheckCircle2 size={16} className="text-[#d6a34d]" />{text}</div>; }
