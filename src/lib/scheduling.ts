import type { TemporalStatus } from "@/types";

const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cayenne" });

export function calculateTemporalStatus(value: string, now = new Date()): TemporalStatus {
  const date = new Date(value);
  if (dayFormatter.format(date) === dayFormatter.format(now)) return "today";
  return date < now ? "overdue" : "scheduled";
}

export function isUpcomingAppointment(status: string, scheduledAt: string, now = new Date()) {
  return (status === "agendada" || status === "reagendada") && new Date(scheduledAt) >= now;
}

export function hasAppointmentConflict(scheduledAt: string, durationMinutes: number, appointments: Array<{ scheduledAt: string; durationMinutes: number; status: string }>) {
  const start = new Date(scheduledAt).getTime();
  const end = start + durationMinutes * 60000;
  return appointments.some((item) => {
    if (!isUpcomingAppointment(item.status, item.scheduledAt, new Date(0))) return false;
    const itemStart = new Date(item.scheduledAt).getTime();
    const itemEnd = itemStart + item.durationMinutes * 60000;
    return start < itemEnd && end > itemStart;
  });
}
