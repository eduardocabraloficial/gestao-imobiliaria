import type { Lead, PropertySubmission } from "@/types";

const now = () => new Date().toISOString();
const initialLeads: Lead[] = [
  { id: "demo-lead-1", propertyId: "demo-property-1", propertyCode: "AP-1042", propertyTitle: "Apartamento com vista aberta e varanda gourmet", propertySlug: "apartamento-3-quartos-jardim-europa-ap-1042", name: "Fernanda Oliveira", phone: "(11) 98888-3322", whatsapp: "(11) 98888-3322", email: "fernanda@example.com", message: "Gostaria de agendar uma visita.", source: "site", status: "novo", createdAt: now(), convertedAt: null, convertedClientId: null },
  { id: "demo-lead-2", propertyId: "demo-property-3", propertyCode: "AP-7715", propertyTitle: "Apartamento mobiliado a poucos passos do parque", propertySlug: "apartamento-mobiliado-moema-ap-7715", name: "Lucas Martins", phone: "(11) 97777-2211", whatsapp: "", email: "lucas@example.com", message: "O imóvel ainda está disponível?", source: "site", status: "em_atendimento", createdAt: new Date(Date.now() - 86400000).toISOString(), convertedAt: null, convertedClientId: null },
];

type DemoStore = { leads: Lead[]; submissions: PropertySubmission[] };
const globalStore = globalThis as typeof globalThis & { __phase5Demo?: DemoStore };
export const phase5DemoStore = globalStore.__phase5Demo ??= { leads: initialLeads, submissions: [] };
