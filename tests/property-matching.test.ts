import assert from "node:assert/strict";
import test from "node:test";
import { propertyCompatibilityScore } from "../src/lib/property-matching.ts";
import type { AdminProperty, Client } from "../src/types/index.ts";

const client = {
  id: "client", name: "Cliente", initials: "CL", phone: "99999999", whatsapp: "99999999", email: "", source: "Site", interest: "Apartamento", stage: "Qualificação", lastContact: "Hoje", nextFollowUp: "A definir", followUpTime: "—", followUpStatus: "scheduled", responsible: "Corretor", budget: "Até R$ 600 mil", neighborhoods: ["Centro"], bedrooms: 2, note: "", purpose: "Compra", propertyType: "Apartamento", minPrice: null, maxPrice: 600000,
} satisfies Client;

const matchingProperty = {
  id: "property", code: "AP-1", slug: "apartamento-centro-ap-1", isPublic: true, title: "Apartamento no Centro", purpose: "venda", propertyType: "Apartamento", description: "", characteristics: [], images: [], price: 550000, condominiumFee: null, iptu: null, address: "", neighborhood: "Centro", city: "São Paulo", state: "SP", zipCode: "", area: 70, bedrooms: 2, suites: 1, bathrooms: 2, parkingSpaces: 1, furnished: false, petsAllowed: true, featured: false, status: "disponivel", imageUrl: "", createdAt: "", updatedAt: "",
} satisfies AdminProperty;

const unrelatedProperty = { ...matchingProperty, id: "other", purpose: "aluguel", propertyType: "Casa", neighborhood: "Outro bairro", price: 1200000, bedrooms: 1 } satisfies AdminProperty;

test("prioriza imóvel que corresponde à finalidade, bairro e quartos", () => {
  const matching = propertyCompatibilityScore(matchingProperty, client);
  const unrelated = propertyCompatibilityScore(unrelatedProperty, client);
  assert.ok(matching > unrelated);
});

test("considera a faixa máxima de preço", () => {
  assert.ok(propertyCompatibilityScore(matchingProperty, client) > propertyCompatibilityScore(unrelatedProperty, client));
});
