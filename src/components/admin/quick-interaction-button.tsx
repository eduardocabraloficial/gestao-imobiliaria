"use client";

import { MessageSquarePlus } from "lucide-react";

export function QuickInteractionButton({ clientId, compact = false }: { clientId?: string; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-quick-interaction", { detail: { clientId } }))}
      className={compact ? "action" : "focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white"}
    >
      <MessageSquarePlus size={compact ? 13 : 15} /> Registrar atendimento
    </button>
  );
}
