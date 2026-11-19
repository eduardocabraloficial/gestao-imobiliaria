import assert from "node:assert/strict";
import test from "node:test";
import { calculateTemporalStatus, hasAppointmentConflict, isUpcomingAppointment } from "../src/lib/scheduling.ts";

const now = new Date("2026-11-09T12:00:00-03:00");

test("classifica pendência atrasada, de hoje e futura dinamicamente", () => {
  assert.equal(calculateTemporalStatus("2026-11-08T10:00:00-03:00", now), "overdue");
  assert.equal(calculateTemporalStatus("2026-11-09T18:00:00-03:00", now), "today");
  assert.equal(calculateTemporalStatus("2026-11-10T10:00:00-03:00", now), "scheduled");
});

test("visita cancelada não aparece entre as próximas", () => {
  assert.equal(isUpcomingAppointment("cancelada", "2026-11-10T10:00:00-03:00", now), false);
  assert.equal(isUpcomingAppointment("agendada", "2026-11-10T10:00:00-03:00", now), true);
});

test("detecta conflito entre intervalos de visita", () => {
  const appointments = [{ scheduledAt: "2026-11-10T10:00:00-03:00", durationMinutes: 60, status: "agendada" }];
  assert.equal(hasAppointmentConflict("2026-11-10T10:30:00-03:00", 45, appointments), true);
  assert.equal(hasAppointmentConflict("2026-11-10T11:30:00-03:00", 45, appointments), false);
});
