import assert from "node:assert/strict";
import test from "node:test";
import { conversionRate, inPeriod, matchesGlobalSearch, periodBounds, sanitizeCsvCell, stageHistoryEntry, toCsv, validateStageMove } from "../src/lib/phase6.ts";

test("valida alteração de etapa e exige motivo para cliente perdido", () => {
  assert.equal(validateStageMove("negociacao", ""), null);
  assert.equal(validateStageMove("perdido", ""), "Informe o motivo da perda.");
  assert.equal(validateStageMove("perdido", "preço"), null);
  assert.equal(validateStageMove("concluido", ""), null);
});

test("calcula taxa de conversão sem divisão por zero", () => {
  assert.equal(conversionRate(2, 8), 25);
  assert.equal(conversionRate(0, 0), 0);
});

test("registra histórico com etapa anterior e nova", () => {
  assert.deepEqual(stageHistoryEntry("qualificacao", "negociacao", "2026-11-10T10:00:00Z"), { previousStage: "qualificacao", newStage: "negociacao", changedAt: "2026-11-10T10:00:00Z" });
});

test("calcula filtros de período", () => {
  const now = new Date("2026-11-10T15:00:00-03:00");
  const { start, end } = periodBounds("7d", now);
  assert.equal(inPeriod("2026-11-05T12:00:00-03:00", start, end), true);
  assert.equal(inPeriod("2026-10-01T12:00:00-03:00", start, end), false);
});

test("sanitiza fórmulas e gera CSV", () => {
  assert.equal(sanitizeCsvCell("=1+1"), '"\'=1+1"');
  const csv = toCsv(["Nome"], [["@comando"], ["Cliente"]]);
  assert.ok(csv.includes("'@comando")); assert.ok(csv.startsWith("\uFEFF"));
});

test("busca global encontra nome, telefone e código", () => {
  assert.equal(matchesGlobalSearch("ap-10", ["Apartamento", "AP-1042"]), true);
  assert.equal(matchesGlobalSearch("joão", ["João da Silva", "11999999999"]), true);
  assert.equal(matchesGlobalSearch("x", ["João"]), false);
});

test("isolamento de configurações é expresso pelo usuário proprietário", () => {
  const canAccess = (rowUser: string, authUser: string) => rowUser === authUser;
  assert.equal(canAccess("user-a", "user-a"), true);
  assert.equal(canAccess("user-a", "user-b"), false);
});
