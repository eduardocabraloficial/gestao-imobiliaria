import test from "node:test";
import assert from "node:assert/strict";
import { clientFilterQuery, daysSinceContact, formatBrazilianPhone, formatCurrency, inactiveClients, nextSearchIndex, paginate, validateQuickInteraction } from "../src/lib/phase7.ts";
import type { Client } from "../src/types/index.ts";

const baseClient: Client = {
  id: "1", name: "Cliente Teste", initials: "CT", phone: "11999999999", whatsapp: "11999999999", email: "teste@exemplo.com",
  source: "Site", interest: "Apartamento", stage: "Qualificação", lastContact: "01/11/2026", nextFollowUp: "10/11/2026",
  followUpTime: "10:00", followUpStatus: "today", responsible: "Corretor", budget: "A definir", neighborhoods: [], bedrooms: 2, note: "",
};

test("identifica clientes ativos sem interação há sete dias", () => {
  const now = new Date("2026-11-10T12:00:00");
  assert.equal(daysSinceContact("01/11/2026", now), 9);
  assert.equal(inactiveClients([baseClient], now).length, 1);
  assert.equal(inactiveClients([{ ...baseClient, stage: "Concluído" }], now).length, 0);
});

test("registro rápido valida cliente, descrição e datas", () => {
  assert.equal(validateQuickInteraction({ clientId: "", description: "Contato", occurredAt: "2026-11-10T10:00" }), "Selecione um cliente.");
  assert.equal(validateQuickInteraction({ clientId: "1", description: "Contato", occurredAt: "inválido" }), "Informe uma data e horário válidos.");
  assert.equal(validateQuickInteraction({ clientId: "1", description: "Contato realizado", occurredAt: "2026-11-10T10:00", nextFollowUpAt: "2026-11-11T10:00" }), null);
});

test("paginação limita resultados e corrige página fora do intervalo", () => {
  const page = paginate([1, 2, 3, 4, 5], 8, 2);
  assert.deepEqual(page.items, [5]);
  assert.equal(page.currentPage, 3);
  assert.equal(page.totalPages, 3);
});

test("filtros persistentes são representados por query params", () => {
  assert.equal(clientFilterQuery("Maria", "today", 2), "q=Maria&status=today&page=2");
  assert.equal(clientFilterQuery("", "all", 1), "");
});

test("busca por teclado circula entre resultados", () => {
  assert.equal(nextSearchIndex(0, 3, 1), 1);
  assert.equal(nextSearchIndex(0, 3, -1), 2);
  assert.equal(nextSearchIndex(0, 0, 1), -1);
});

test("formata telefone e moeda em pt-BR", () => {
  assert.equal(formatBrazilianPhone("5511999999999"), "(11) 99999-9999");
  assert.match(formatCurrency(1234.5), /R\$\s?1\.234,50/);
});
