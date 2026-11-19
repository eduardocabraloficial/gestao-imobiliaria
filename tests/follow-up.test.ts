import assert from "node:assert/strict";
import test from "node:test";
import { calculateFollowUpStatus } from "../src/lib/crm.ts";

const now = new Date("2026-11-09T15:00:00-03:00");

test("classifica retorno pendente anterior como atrasado", () => {
  assert.equal(calculateFollowUpStatus("2026-11-08T14:00:00-03:00", now), "overdue");
});

test("classifica qualquer horário da data atual como hoje", () => {
  assert.equal(calculateFollowUpStatus("2026-11-09T20:00:00-03:00", now), "today");
});

test("classifica retorno posterior como agendado", () => {
  assert.equal(calculateFollowUpStatus("2026-11-10T09:00:00-03:00", now), "scheduled");
});
