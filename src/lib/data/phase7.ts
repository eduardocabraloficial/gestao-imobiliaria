import "server-only";
import { cache } from "react";
import { listLeads } from "@/lib/data/leads";
import { getSchedulingData } from "@/lib/data/scheduling";
import { calculateTemporalStatus } from "@/lib/scheduling";
import { inactiveClients } from "@/lib/phase7";

export type ProductivityNotification = {
  id: string;
  label: string;
  detail: string;
  href: string;
  priority: "urgent" | "attention" | "normal";
};

export const getProductivityData = cache(async () => {
  const [schedule, leadData] = await Promise.all([getSchedulingData(), listLeads()]);
  const activeAppointments = schedule.appointments.filter((item) => ["agendada", "reagendada"].includes(item.status));
  const visitsToday = activeAppointments.filter((item) => calculateTemporalStatus(item.scheduledAt) === "today");
  const tasksToday = schedule.tasks.filter((item) => item.status === "pendente" && item.temporalStatus === "today");
  const overdueTasks = schedule.tasks.filter((item) => item.status === "pendente" && item.temporalStatus === "overdue");
  const followUpsToday = schedule.clients.filter((item) => Boolean(item.followUpId) && item.followUpStatus === "today");
  const overdueFollowUps = schedule.clients.filter((item) => Boolean(item.followUpId) && item.followUpStatus === "overdue");
  const newLeads = leadData.leads.filter((item) => item.status === "novo");
  const staleClients = inactiveClients(schedule.clients);

  const notifications: ProductivityNotification[] = [
    overdueFollowUps.length ? { id: "overdue-followups", label: `${overdueFollowUps.length} retorno(s) atrasado(s)`, detail: "Clientes aguardando contato", href: "/admin/hoje#retornos-atrasados", priority: "urgent" } : null,
    overdueTasks.length ? { id: "overdue-tasks", label: `${overdueTasks.length} pendência(s) atrasada(s)`, detail: "Ações operacionais prioritárias", href: "/admin/hoje#pendencias-atrasadas", priority: "urgent" } : null,
    visitsToday.length ? { id: "today-visits", label: `${visitsToday.length} visita(s) hoje`, detail: "Confira horários e imóveis", href: "/admin/hoje#visitas-hoje", priority: "attention" } : null,
    newLeads.length ? { id: "new-leads", label: `${newLeads.length} novo(s) lead(s)`, detail: "Aguardando primeiro contato", href: "/admin/leads?status=novo", priority: "attention" } : null,
    staleClients.length ? { id: "stale-clients", label: `${staleClients.length} cliente(s) sem contato`, detail: "Sem interação há 7 dias ou mais", href: "/admin/hoje#clientes-sem-contato", priority: "normal" } : null,
  ].filter((item): item is ProductivityNotification => item !== null);

  const searchItems = [
    ...schedule.clients.map((client) => ({ id: client.id, type: "Cliente", title: client.name, detail: `${client.phone} · ${client.email}`, href: `/admin/clientes/${client.id}`, search: `${client.name} ${client.phone} ${client.email}` })),
    ...schedule.properties.map((property) => ({ id: property.id, type: "Imóvel", title: property.title, detail: `${property.code} · ${property.neighborhood}`, href: `/admin/imoveis/${property.id}`, search: `${property.title} ${property.code} ${property.neighborhood}` })),
    ...leadData.leads.map((lead) => ({ id: lead.id, type: "Lead", title: lead.name, detail: `${lead.phone} · ${lead.propertyCode}`, href: `/admin/leads/${lead.id}`, search: `${lead.name} ${lead.phone} ${lead.email} ${lead.propertyCode}` })),
  ];

  return {
    ...schedule,
    leads: leadData.leads,
    followUpsToday,
    overdueFollowUps,
    tasksToday,
    overdueTasks,
    visitsToday,
    newLeads,
    staleClients,
    notifications,
    searchItems,
  };
});
