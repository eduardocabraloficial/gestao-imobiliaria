import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/auth";
import { getProductivityData } from "@/lib/data/phase7";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const productivity = await getProductivityData();
  return <AdminShell user={{ name: user.name, email: user.email }} newLeadCount={productivity.newLeads.length} searchItems={productivity.searchItems} notifications={productivity.notifications} quickClients={productivity.clients.map((client) => ({ id: client.id, name: client.name, followUpId: client.followUpId }))}>{children}</AdminShell>;
}
