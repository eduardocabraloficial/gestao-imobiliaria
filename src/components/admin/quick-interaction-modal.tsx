"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { createQuickInteractionAction } from "@/app/admin/clientes/actions";

type ClientOption = { id: string; name: string; followUpId?: string };

export function QuickInteractionModal({
  open,
  clients,
  initialClientId,
  onClose,
}: {
  open: boolean;
  clients: ClientOption[];
  initialClientId?: string;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  if (!open) return null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");
    startTransition(async () => {
      const result = await createQuickInteractionAction({
        clientId: String(form.get("clientId")),
        type: String(form.get("type")) as "ligacao" | "whatsapp" | "email" | "reuniao" | "visita" | "observacao",
        description: String(form.get("description")),
        occurredAt: String(form.get("occurredAt")),
        completeCurrentFollowUp: form.get("completeCurrentFollowUp") === "on",
        nextFollowUpAt: String(form.get("nextFollowUpAt")),
      });
      if (!result.success) { setError(result.message); return; }
      setMessage(result.message);
      formElement.reset();
      window.setTimeout(() => { setMessage(""); onClose(); }, 900);
    });
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#10241f]/55 p-4" role="dialog" aria-modal="true" aria-labelledby="quick-interaction-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#eceeea] p-5">
          <div><h2 id="quick-interaction-title" className="text-lg font-extrabold">Registrar atendimento</h2><p className="mt-1 text-xs text-[#77817c]">Registre o contato e já organize o próximo passo.</p></div>
          <button type="button" onClick={onClose} className="focus-ring grid size-8 place-items-center rounded-lg" aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="sm:col-span-2"><Label text="Cliente *" /><select name="clientId" required defaultValue={initialClientId ?? ""} className="field"><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label><Label text="Tipo *" /><select name="type" defaultValue="whatsapp" className="field"><option value="ligacao">Ligação</option><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="reuniao">Reunião</option><option value="visita">Visita</option><option value="observacao">Observação</option></select></label>
          <label><Label text="Data e hora *" /><input name="occurredAt" type="datetime-local" required defaultValue={localNow()} className="field" /></label>
          <label className="sm:col-span-2"><Label text="Descrição *" /><textarea name="description" required rows={3} className="field h-auto py-3" placeholder="Resumo objetivo do atendimento" /></label>
          <label><Label text="Próximo retorno" /><input name="nextFollowUpAt" type="datetime-local" className="field" /></label>
          <label className="flex items-center gap-2 self-end pb-3 text-xs font-semibold"><input name="completeCurrentFollowUp" type="checkbox" className="size-4 accent-[#173f35]" /> Concluir retorno atual</label>
          {error && <p role="alert" className="rounded-xl bg-[#fff4f3] p-3 text-xs font-bold text-[#a8443f] sm:col-span-2">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-[#edf6f1] p-3 text-xs font-bold text-[#315d50] sm:col-span-2">{message}</p>}
          <div className="flex justify-end gap-2 border-t border-[#eceeea] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-xl border border-[#dfe3df] px-4 py-2.5 text-xs font-bold">Cancelar</button><button disabled={pending} className="rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{pending ? "Salvando..." : "Registrar atendimento"}</button></div>
        </div>
      </form>
    </div>
  );
}

function Label({ text }: { text: string }) { return <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f7974]">{text}</span>; }
function localNow() { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
