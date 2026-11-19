import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationSettings } from "@/lib/data/phase6";

export default async function SettingsPage() { const [user, settings] = await Promise.all([getCurrentUser(), getOrganizationSettings()]); return <><PageHeader eyebrow="Administração" title="Configurações" description="Perfil, dados comerciais e estrutura de personalização do site." /><SettingsForm settings={settings} profile={{ name: user?.name ?? "", email: user?.email ?? "", phone: "" }} /><section className="surface mt-5 rounded-2xl p-5"><h2 className="text-base font-extrabold">Preferências de produtividade</h2><p className="mt-1 text-xs text-[#7a837e]">Estrutura preparada para personalização futura, sem alterar o comportamento atual.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><Preference label="Alerta sem contato" value="7 dias" /><Preference label="Início da agenda" value="08:00" /><Preference label="Visualização inicial" value="Central Hoje" /></div></section></>; }

function Preference({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#f6f7f4] p-3"><p className="text-[9px] font-bold uppercase text-[#7a837e]">{label}</p><p className="mt-1 text-sm font-extrabold">{value}</p></div>; }
