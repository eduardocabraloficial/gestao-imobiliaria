import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { clients as demoClients } from "@/lib/demo-data";
import { demoAdminProperties, demoInterestLinks } from "@/lib/demo-properties";
import { demoAppointments, demoTasks } from "@/lib/demo-scheduling";
import { calculateTemporalStatus, isUpcomingAppointment } from "@/lib/scheduling";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { calculateFollowUpStatus, clientRowToView } from "@/lib/crm";
import { propertyRowToView } from "@/lib/data/properties";
import type { AdminProperty, Appointment, Client, Task } from "@/types";
import type { AppointmentRow, ClientPropertyInterestRow, ClientRow, FollowUpRow, InteractionRow, PropertyRow, TaskRow } from "@/types/database";
import { phase7DemoStore } from "@/lib/demo-phase7";

export interface SchedulingData {
  appointments: Appointment[]; tasks: Task[]; clients: Client[]; properties: AdminProperty[];
  interests: Array<{ clientId: string; propertyId: string }>; demoMode: boolean;
}

export async function getSchedulingData(): Promise<SchedulingData> {
  if (!isSupabaseConfigured()) {
    const clients = demoClients.map((client) => {
      const next = phase7DemoStore.nextFollowUps[client.id];
      const completed = phase7DemoStore.completedFollowUps.has(client.id) && !next;
      return {
        ...client,
        lastInteractionAt: phase7DemoStore.lastInteractionAt[client.id] ?? client.lastInteractionAt,
        lastContact: phase7DemoStore.lastInteractionAt[client.id] ? new Intl.DateTimeFormat("pt-BR").format(new Date(phase7DemoStore.lastInteractionAt[client.id])) : client.lastContact,
        followUpId: completed ? undefined : `demo-followup-${client.id}`,
        ...(next ? { followUpScheduledAt: next, nextFollowUp: new Intl.DateTimeFormat("pt-BR").format(new Date(next)), followUpTime: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(next)), followUpStatus: calculateFollowUpStatus(next) } : {}),
      };
    });
    return { appointments: demoAppointments, tasks: demoTasks, clients, properties: demoAdminProperties, interests: demoInterestLinks, demoMode: true };
  }
  const user = await getCurrentUser();
  if (!user) return { appointments: [], tasks: [], clients: [], properties: [], interests: [], demoMode: false };
  const supabase = await createSupabaseServerClient();
  const [appointmentsResult, tasksResult, clientsResult, propertiesResult, interestsResult, interactionsResult, followUpsResult] = await Promise.all([
    supabase.from("appointments").select("*").eq("user_id", user.id).order("scheduled_at"),
    supabase.from("tasks").select("*").eq("user_id", user.id).order("due_at"),
    supabase.from("clients").select("*").eq("user_id", user.id),
    supabase.from("properties").select("*").eq("user_id", user.id),
    supabase.from("client_property_interests").select("*").eq("user_id", user.id),
    supabase.from("interactions").select("*").eq("user_id", user.id),
    supabase.from("follow_ups").select("*").eq("user_id", user.id),
  ]);
  const error = appointmentsResult.error ?? tasksResult.error ?? clientsResult.error ?? propertiesResult.error;
  if (error) throw new Error(`Não foi possível carregar agenda e pendências: ${error.message}`);
  const clientRows = (clientsResult.data ?? []) as ClientRow[];
  const propertyRows = (propertiesResult.data ?? []) as PropertyRow[];
  const interactions = (interactionsResult.data ?? []) as InteractionRow[];
  const followUps = (followUpsResult.data ?? []) as FollowUpRow[];
  const clients = clientRows.map((row) => clientRowToView(row, interactions, followUps, user.name));
  const properties = propertyRows.map((row) => propertyRowToView(row));
  const clientMap = new Map(clients.map((item) => [item.id, item]));
  const propertyMap = new Map(properties.map((item) => [item.id, item]));
  const appointments = ((appointmentsResult.data ?? []) as AppointmentRow[]).map((row) => ({ id: row.id, clientId: row.client_id, propertyId: row.property_id, scheduledAt: row.scheduled_at, durationMinutes: row.duration_minutes, notes: row.notes ?? "", status: row.status, clientName: clientMap.get(row.client_id)?.name ?? "Cliente", propertyCode: propertyMap.get(row.property_id)?.code ?? "Imóvel", propertyTitle: propertyMap.get(row.property_id)?.title ?? "" }));
  const tasks = ((tasksResult.data ?? []) as TaskRow[]).map((row) => ({ id: row.id, clientId: row.client_id, propertyId: row.property_id, title: row.title, description: row.description ?? "", dueAt: row.due_at, priority: row.priority, status: row.status, completedAt: row.completed_at, temporalStatus: calculateTemporalStatus(row.due_at), clientName: row.client_id ? clientMap.get(row.client_id)?.name ?? "Cliente" : "", propertyCode: row.property_id ? propertyMap.get(row.property_id)?.code ?? "Imóvel" : "" }));
  return { appointments, tasks, clients, properties, interests: ((interestsResult.data ?? []) as ClientPropertyInterestRow[]).map((row) => ({ clientId: row.client_id, propertyId: row.property_id })), demoMode: false };
}

export async function getRelatedScheduling(type: "client" | "property", id: string) {
  const data = await getSchedulingData();
  return { appointments: data.appointments.filter((item) => type === "client" ? item.clientId === id : item.propertyId === id), tasks: data.tasks.filter((item) => type === "client" ? item.clientId === id : item.propertyId === id), demoMode: data.demoMode };
}

export async function getScheduleStats() {
  if (!isSupabaseConfigured()) return {
    visitsToday: demoAppointments.filter((item) => calculateTemporalStatus(item.scheduledAt) === "today" && item.status === "agendada").length,
    upcomingVisits: demoAppointments.filter((item) => isUpcomingAppointment(item.status, item.scheduledAt)).length,
    overdueTasks: demoTasks.filter((item) => item.status === "pendente" && item.temporalStatus === "overdue").length,
  };
  const user = await getCurrentUser(); if (!user) return { visitsToday: 0, upcomingVisits: 0, overdueTasks: 0 };
  const supabase = await createSupabaseServerClient();
  const [appointmentsResult, tasksResult] = await Promise.all([supabase.from("appointments").select("scheduled_at,status").eq("user_id", user.id), supabase.from("tasks").select("due_at,status").eq("user_id", user.id)]);
  const appointments = (appointmentsResult.data ?? []) as Pick<AppointmentRow, "scheduled_at" | "status">[];
  const tasks = (tasksResult.data ?? []) as Pick<TaskRow, "due_at" | "status">[];
  return { visitsToday: appointments.filter((item) => calculateTemporalStatus(item.scheduled_at) === "today" && (item.status === "agendada" || item.status === "reagendada")).length, upcomingVisits: appointments.filter((item) => isUpcomingAppointment(item.status, item.scheduled_at)).length, overdueTasks: tasks.filter((item) => item.status === "pendente" && calculateTemporalStatus(item.due_at) === "overdue").length };
}
