"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

export default function AdminError({ retry }: { error: unknown; retry: () => void }) {
  return <div className="surface rounded-2xl p-10 text-center"><CircleAlert className="mx-auto text-[#b34b45]" size={32} /><h1 className="mt-4 text-xl font-extrabold">Não foi possível carregar esta área</h1><p className="mt-2 text-sm text-[#6f7974]">Tente novamente. Se o problema continuar, volte ao painel e retome a operação.</p><button onClick={retry} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white"><RotateCcw size={14} /> Tentar novamente</button></div>;
}
