"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { matchesGlobalSearch } from "@/lib/phase6";
import { nextSearchIndex } from "@/lib/phase7";

type Item = { id: string; type: string; title: string; detail: string; href: string; search: string };
const commands: Item[] = [
  { id: "agenda", type: "Atalho", title: "Abrir Agenda", detail: "Visitas e compromissos", href: "/admin/agenda", search: "agenda visita agendar" },
  { id: "leads", type: "Atalho", title: "Abrir Leads", detail: "Novos interessados", href: "/admin/leads", search: "leads interessados" },
  { id: "new-client", type: "Ação", title: "Criar cliente", detail: "Abrir cadastro rápido", href: "/admin/clientes?novo=1", search: "novo criar cadastrar cliente" },
  { id: "new-visit", type: "Ação", title: "Agendar visita", detail: "Abrir agenda", href: "/admin/agenda?novo=1", search: "nova criar agendar visita" },
];

export function GlobalSearch({ items }: { items: Item[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const source = [...commands, ...items];
  const results = query.trim().length >= 2
    ? source.filter((item) => matchesGlobalSearch(query, [item.search, item.title])).slice(0, 8)
    : commands;

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  function close() { setOpen(false); setQuery(""); setActiveIndex(0); }
  function navigate(href: string) { close(); router.push(href); }

  return (
    <div className="relative w-full max-w-md">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a928e]" />
      <input
        ref={inputRef}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((value) => nextSearchIndex(value, results.length, 1)); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((value) => nextSearchIndex(value, results.length, -1)); }
          if (event.key === "Enter" && results[activeIndex]) { event.preventDefault(); navigate(results[activeIndex].href); }
          if (event.key === "Escape") { event.preventDefault(); close(); inputRef.current?.blur(); }
        }}
        placeholder="Buscar ou usar Ctrl + K..."
        aria-label="Busca global"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="global-search-results"
        aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
        className="focus-ring h-10 w-full rounded-xl border border-[#e1e4e0] bg-[#fafbf9] pl-9 pr-16 text-xs"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[#dfe3df] px-1.5 py-0.5 text-[8px] font-bold text-[#7a837e] sm:block">⌘K</span>
      {query && <button onClick={close} className="absolute right-10 top-1/2 -translate-y-1/2 sm:right-12" aria-label="Limpar busca"><X size={14} /></button>}
      {open && (
        <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-[#e1e4e0] bg-white shadow-xl">
          {results.map((item, index) => (
            <Link
              id={`search-result-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              key={`${item.type}-${item.id}`}
              href={item.href}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={close}
              className={`block border-b border-[#eef0ed] px-4 py-3 last:border-0 ${activeIndex === index ? "bg-[#f2f6f3]" : "hover:bg-[#f7f8f5]"}`}
            >
              <p className="text-[9px] font-bold uppercase text-[#9a7748]">{item.type}</p>
              <p className="text-xs font-extrabold">{item.title}</p>
              <p className="truncate text-[10px] text-[#7a837e]">{item.detail}</p>
            </Link>
          ))}
          {!results.length && <p className="px-4 py-5 text-center text-xs text-[#7a837e]">Nenhum resultado encontrado.</p>}
          <p className="border-t border-[#eef0ed] px-4 py-2 text-[9px] text-[#8a928e]">↑↓ navegar · Enter abrir · Esc fechar</p>
        </div>
      )}
    </div>
  );
}
