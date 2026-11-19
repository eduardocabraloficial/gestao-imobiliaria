export type FollowUpStatus = "overdue" | "today" | "scheduled";

export type { ClientStageCode, FollowUpDatabaseStatus, InteractionType } from "./database";
export type { PropertyPurpose, PropertyStatus } from "./database";
export type { AppointmentStatus, TaskPriority, TaskStatus } from "./database";
export type { LeadStatus, PropertySubmissionStatus } from "./database";

export type ClientStage =
  | "Novo lead"
  | "Primeiro contato"
  | "Qualificação"
  | "Imóveis enviados"
  | "Visita agendada"
  | "Visita realizada"
  | "Negociação"
  | "Proposta"
  | "Documentação"
  | "Concluído"
  | "Perdido";

export interface Client {
  id: string;
  name: string;
  initials: string;
  phone: string;
  whatsapp: string;
  email: string;
  source: string;
  interest: string;
  propertyCode?: string;
  stage: ClientStage;
  lastContact: string;
  lastInteractionAt?: string;
  nextFollowUp: string;
  followUpTime: string;
  followUpStatus: FollowUpStatus;
  responsible: string;
  budget: string;
  neighborhoods: string[];
  bedrooms: number;
  note: string;
  purpose?: string;
  propertyType?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  createdAt?: string;
  updatedAt?: string;
  followUpId?: string;
  followUpScheduledAt?: string;
  estimatedValue?: number | null;
  lossReason?: string;
}

export interface Interaction {
  id: string;
  type: import("./database").InteractionType;
  description: string;
  occurredAt: string;
  responsible: string;
}

export interface FollowUp {
  id: string;
  scheduledAt: string;
  notes: string;
  status: import("./database").FollowUpDatabaseStatus;
  completedAt: string | null;
}

export interface DashboardData {
  profileName: string;
  clientsActive: number;
  followUpsToday: number;
  followUpsOverdue: number;
  newLeads: number;
  clients: Client[];
  demoMode: boolean;
  propertiesAvailable: number;
  propertiesReserved: number;
  propertiesClosed: number;
  visitsToday: number;
  upcomingVisits: number;
  overdueTasks: number;
  recentLeads: Lead[];
  negotiatingClients: number;
  closedThisMonth: number;
}

export interface ClientInput {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  source: string;
  purpose: string;
  propertyType: string;
  neighborhoods: string[];
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  notes: string;
  estimatedValue?: number | null;
}

export interface StageHistory { id: string; previousStage: ClientStage; newStage: ClientStage; changedAt: string }
export interface OrganizationSettings {
  id: string; businessName: string; tradeName: string; creci: string; phone: string; whatsapp: string; email: string;
  address: string; instagram: string; website: string; description: string; logoPath: string; primaryColor: string;
  secondaryColor: string; heroTitle: string; heroSubtitle: string; footerText: string;
}

export interface AdminProperty {
  id: string;
  code: string;
  title: string;
  purpose: import("./database").PropertyPurpose;
  propertyType: string;
  description: string;
  price: number;
  condominiumFee: number | null;
  iptu: number | null;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  area: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  furnished: boolean;
  petsAllowed: boolean;
  featured: boolean;
  status: import("./database").PropertyStatus;
  imageUrl: string;
  slug: string;
  isPublic: boolean;
  characteristics: string[];
  images: PropertyImage[];
  createdAt: string;
  updatedAt: string;
}

export type PropertyInput = Omit<AdminProperty, "id" | "slug" | "images" | "createdAt" | "updatedAt">;

export interface PropertyImage {
  id: string; propertyId: string; storagePath: string; url: string; isCover: boolean; sortOrder: number;
}

export interface Lead {
  id: string; propertyId: string; propertyCode: string; propertyTitle: string; propertySlug: string;
  name: string; phone: string; whatsapp: string; email: string; message: string; source: "site";
  status: import("./database").LeadStatus; createdAt: string; convertedAt: string | null; convertedClientId: string | null;
}

export interface PropertySubmission {
  id: string; ownerName: string; phone: string; email: string; purpose: import("./database").PropertyPurpose;
  propertyType: string; neighborhood: string; city: string; desiredPrice: number | null; description: string;
  status: import("./database").PropertySubmissionStatus; createdAt: string;
}

export interface PropertyInterest {
  id: string;
  clientId: string;
  propertyId: string;
  notes: string;
  property?: AdminProperty;
  client?: Client;
}

export type TemporalStatus = "overdue" | "today" | "scheduled";

export interface Appointment {
  id: string; clientId: string; propertyId: string; scheduledAt: string; durationMinutes: number;
  notes: string; status: import("./database").AppointmentStatus; clientName: string; propertyCode: string; propertyTitle: string;
}

export interface AppointmentInput {
  clientId: string; propertyId: string; scheduledAt: string; durationMinutes: number; notes: string;
}

export interface Task {
  id: string; clientId: string | null; propertyId: string | null; title: string; description: string;
  dueAt: string; priority: import("./database").TaskPriority; status: import("./database").TaskStatus;
  completedAt: string | null; temporalStatus: TemporalStatus; clientName: string; propertyCode: string;
}

export interface TaskInput {
  clientId: string | null; propertyId: string | null; title: string; description: string;
  dueAt: string; priority: import("./database").TaskPriority;
}

export interface Property {
  id: string;
  slug: string;
  code: string;
  title: string;
  neighborhood: string;
  city: string;
  price: string;
  purpose: "Venda" | "Aluguel";
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  image: string;
  propertyType: string;
  description: string;
  condominiumFee: number | null;
  iptu: number | null;
  suites: number;
  characteristics: string[];
  images: PropertyImage[];
  createdAt: string;
  featured: boolean;
}
