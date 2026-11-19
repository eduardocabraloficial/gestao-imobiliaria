"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRoundPlus,
  UsersRound,
  Columns3,
  MessageSquarePlus,
  SunMedium,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/admin/global-search";
import { QuickInteractionModal } from "@/components/admin/quick-interaction-modal";
import type { ProductivityNotification } from "@/lib/data/phase7";

const navigation = [
  { label: "Hoje", href: "/admin/hoje", icon: SunMedium },
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Clientes", href: "/admin/clientes", icon: UsersRound },
  { label: "Leads", href: "/admin/leads", icon: UserRoundPlus },
  { label: "Imóveis", href: "/admin/imoveis", icon: Building2 },
  { label: "Funil", href: "/admin/funil", icon: Columns3 },
  { label: "Agenda", href: "/admin/agenda", icon: CalendarDays },
  { label: "Pendências", href: "/admin/pendencias", icon: ClipboardCheck },
  { label: "Captações", href: "/admin/captacoes", icon: Inbox },
  { label: "Relatórios", href: "/admin/relatorios", icon: BarChart3 },
];

export function AdminShell({
  children,
  user,
  newLeadCount,
  searchItems,
  notifications,
  quickClients,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  newLeadCount: number;
  searchItems: Array<{ id: string; type: string; title: string; detail: string; href: string; search: string }>;
  notifications: ProductivityNotification[];
  quickClients: Array<{ id: string; name: string; followUpId?: string }>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickClientId, setQuickClientId] = useState<string | undefined>();

  useEffect(() => {
    function openQuick(event: Event) {
      setQuickClientId((event as CustomEvent<{ clientId?: string }>).detail?.clientId);
      setQuickOpen(true);
    }
    window.addEventListener("open-quick-interaction", openQuick);
    return () => window.removeEventListener("open-quick-interaction", openQuick);
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <button
        className="focus-ring fixed left-4 top-4 z-50 grid size-10 place-items-center rounded-xl border border-[#e4e7e2] bg-white text-[#173f35] shadow-sm lg:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && <button className="fixed inset-0 z-30 bg-black/35 lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)} />}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#111111] px-4 py-6 text-white transition-transform duration-200 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="px-2"><Brand light /></div>
        <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Gestão</p>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                  active ? "border-l-2 border-[#d6a34d] bg-white/10 text-white" : "border-l-2 border-transparent text-white/60 hover:bg-white/6 hover:text-white",
                )}
              >
                <item.icon size={18} strokeWidth={1.8} />
                {item.label}
                {item.href === "/admin/leads" && newLeadCount > 0 && <span className="ml-auto rounded-full bg-[#d6a34d] px-2 py-0.5 text-[9px] font-extrabold text-[#111111]">{newLeadCount}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <Link href="/admin/configuracoes" className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-white/60 hover:bg-white/6 hover:text-white">
            <Settings size={18} /> Configurações
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-white/60 hover:bg-white/6 hover:text-white">
              <LogOut size={18} /> Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-[#e7e4dd] bg-white px-16 py-3 lg:px-8">
          <GlobalSearch items={searchItems} />
          <div className="flex items-center gap-3">
            <button onClick={() => { setQuickClientId(undefined); setQuickOpen(true); }} className="focus-ring hidden items-center gap-2 rounded-xl border border-[#e1e5e1] px-3 py-2 text-[10px] font-bold text-[#315d50] xl:flex"><MessageSquarePlus size={14} /> Atendimento</button>
            <div className="relative">
              <button onClick={() => setNotificationsOpen((value) => !value)} className="focus-ring relative grid size-9 place-items-center rounded-xl border border-[#e1e5e1] text-[#53635c]" aria-label="Notificações" aria-expanded={notificationsOpen}>
                <Bell size={16} />
                {notifications.length > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#b34b45] px-1 text-[8px] font-bold text-white">{notifications.length}</span>}
              </button>
              {notificationsOpen && <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-[#e1e5e1] bg-white shadow-xl"><div className="border-b border-[#edf0ed] px-4 py-3"><p className="text-xs font-extrabold">Notificações</p><p className="text-[9px] text-[#7a837e]">Prioridades calculadas com seus dados.</p></div>{notifications.map((item) => <Link key={item.id} href={item.href} onClick={() => setNotificationsOpen(false)} className="flex gap-3 border-b border-[#edf0ed] px-4 py-3 last:border-0 hover:bg-[#f8faf8]"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.priority === "urgent" ? "bg-[#b34b45]" : item.priority === "attention" ? "bg-[#c58a34]" : "bg-[#4f7769]"}`} /><span><span className="block text-[11px] font-bold">{item.label}</span><span className="text-[9px] text-[#7a837e]">{item.detail}</span></span></Link>)}{notifications.length === 0 && <p className="px-4 py-8 text-center text-xs text-[#7a837e]">Tudo em dia por aqui.</p>}</div>}
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-[#f4ecdd] text-xs font-bold text-[#795a25]">CH</div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-[#1b2924]">{user.name}</p>
              <p className="text-[10px] text-[#7b847f]">Corretora responsável</p>
            </div>
            <ChevronDown size={15} className="text-[#8a918d]" />
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1500px] overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <QuickInteractionModal key={`${quickOpen}-${quickClientId ?? "all"}`} open={quickOpen} clients={quickClients} initialClientId={quickClientId} onClose={() => setQuickOpen(false)} />
    </div>
  );
}
