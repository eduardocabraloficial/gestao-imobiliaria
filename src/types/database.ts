export type ClientStageCode =
  | "novo_lead"
  | "primeiro_contato"
  | "qualificacao"
  | "imoveis_enviados"
  | "visita_agendada"
  | "visita_realizada"
  | "negociacao"
  | "proposta"
  | "documentacao"
  | "concluido"
  | "perdido";

export type InteractionType =
  | "ligacao"
  | "whatsapp"
  | "email"
  | "reuniao"
  | "visita"
  | "observacao";

export type FollowUpDatabaseStatus = "pendente" | "concluido" | "cancelado";
export type PropertyPurpose = "venda" | "aluguel";
export type PropertyStatus = "disponivel" | "reservado" | "vendido" | "alugado" | "inativo";
export type AppointmentStatus = "agendada" | "realizada" | "cancelada" | "reagendada";
export type TaskPriority = "baixa" | "media" | "alta";
export type TaskStatus = "pendente" | "concluida" | "cancelada";
export type LeadStatus = "novo" | "em_atendimento" | "convertido" | "descartado";
export type PropertySubmissionStatus = "novo" | "em_analise" | "aprovado" | "recusado";

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientRow {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  source: string;
  purpose: string | null;
  property_type: string | null;
  neighborhoods: string[];
  min_price: number | null;
  max_price: number | null;
  bedrooms: number | null;
  notes: string | null;
  stage: ClientStageCode;
  estimated_value: number | null;
  loss_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientStageHistoryRow { id: string; user_id: string; client_id: string; previous_stage: ClientStageCode; new_stage: ClientStageCode; changed_at: string }
export interface OrganizationSettingsRow {
  id: string; user_id: string; business_name: string | null; trade_name: string | null; creci: string | null;
  phone: string | null; whatsapp: string | null; email: string | null; address: string | null; instagram: string | null;
  website: string | null; description: string | null; logo_path: string | null; primary_color: string | null;
  secondary_color: string | null; hero_title: string | null; hero_subtitle: string | null; footer_text: string | null;
  created_at: string; updated_at: string;
}

export interface InteractionRow {
  id: string;
  client_id: string;
  user_id: string;
  type: InteractionType;
  description: string;
  occurred_at: string;
  created_at: string;
}

export interface FollowUpRow {
  id: string;
  client_id: string;
  user_id: string;
  scheduled_at: string;
  notes: string | null;
  status: FollowUpDatabaseStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyRow {
  id: string;
  user_id: string;
  code: string;
  title: string;
  purpose: PropertyPurpose;
  property_type: string;
  description: string | null;
  price: number;
  condominium_fee: number | null;
  iptu: number | null;
  address: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string | null;
  area: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  furnished: boolean;
  pets_allowed: boolean;
  featured: boolean;
  status: PropertyStatus;
  image_url: string | null;
  slug: string;
  is_public: boolean;
  characteristics: string[];
  created_at: string;
  updated_at: string;
}

export interface PropertyImageRow {
  id: string; property_id: string; user_id: string; storage_path: string; is_cover: boolean; sort_order: number; created_at: string;
}

export interface LeadRow {
  id: string; user_id: string; property_id: string; name: string; phone: string; whatsapp: string | null;
  email: string; message: string; source: "site"; status: LeadStatus; created_at: string;
  converted_at: string | null; converted_client_id: string | null;
}

export interface PropertySubmissionRow {
  id: string; user_id: string | null; owner_name: string; phone: string; email: string; purpose: PropertyPurpose; property_type: string;
  neighborhood: string; city: string; desired_price: number | null; description: string | null;
  status: PropertySubmissionStatus; created_at: string;
}

export interface ClientPropertyInterestRow {
  id: string;
  user_id: string;
  client_id: string;
  property_id: string;
  notes: string | null;
  created_at: string;
}

export interface AppointmentRow {
  id: string; user_id: string; client_id: string; property_id: string; scheduled_at: string;
  duration_minutes: number; notes: string | null; status: AppointmentStatus; created_at: string; updated_at: string;
}

export interface TaskRow {
  id: string; user_id: string; client_id: string | null; property_id: string | null; title: string;
  description: string | null; due_at: string; priority: TaskPriority; status: TaskStatus;
  completed_at: string | null; created_at: string; updated_at: string;
}

type TableDefinition<Row, Insert, Update> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow, Omit<ProfileRow, "created_at" | "updated_at"> & Partial<Pick<ProfileRow, "created_at" | "updated_at">>, Partial<ProfileRow>>;
      clients: TableDefinition<ClientRow, Omit<ClientRow, "id" | "created_at" | "updated_at" | "estimated_value" | "loss_reason"> & Partial<Pick<ClientRow, "id" | "created_at" | "updated_at" | "estimated_value" | "loss_reason">>, Partial<Omit<ClientRow, "id" | "user_id" | "created_at">>>;
      interactions: TableDefinition<InteractionRow, Omit<InteractionRow, "id" | "created_at"> & Partial<Pick<InteractionRow, "id" | "created_at">>, Partial<Omit<InteractionRow, "id" | "client_id" | "user_id" | "created_at">>>;
      follow_ups: TableDefinition<FollowUpRow, Omit<FollowUpRow, "id" | "created_at" | "updated_at" | "completed_at"> & Partial<Pick<FollowUpRow, "id" | "created_at" | "updated_at" | "completed_at">>, Partial<Omit<FollowUpRow, "id" | "client_id" | "user_id" | "created_at">>>;
      properties: TableDefinition<PropertyRow, Omit<PropertyRow, "id" | "created_at" | "updated_at" | "slug"> & Partial<Pick<PropertyRow, "id" | "created_at" | "updated_at" | "slug">>, Partial<Omit<PropertyRow, "id" | "user_id" | "created_at">>>;
      client_property_interests: TableDefinition<ClientPropertyInterestRow, Omit<ClientPropertyInterestRow, "id" | "created_at"> & Partial<Pick<ClientPropertyInterestRow, "id" | "created_at">>, Partial<Omit<ClientPropertyInterestRow, "id" | "user_id" | "client_id" | "property_id" | "created_at">>>;
      appointments: TableDefinition<AppointmentRow, Omit<AppointmentRow, "id" | "created_at" | "updated_at"> & Partial<Pick<AppointmentRow, "id" | "created_at" | "updated_at">>, Partial<Omit<AppointmentRow, "id" | "user_id" | "created_at">>>;
      tasks: TableDefinition<TaskRow, Omit<TaskRow, "id" | "created_at" | "updated_at" | "completed_at"> & Partial<Pick<TaskRow, "id" | "created_at" | "updated_at" | "completed_at">>, Partial<Omit<TaskRow, "id" | "user_id" | "created_at">>>;
      property_images: TableDefinition<PropertyImageRow, Omit<PropertyImageRow, "id" | "created_at"> & Partial<Pick<PropertyImageRow, "id" | "created_at">>, Partial<Omit<PropertyImageRow, "id" | "user_id" | "property_id" | "created_at">>>;
      leads: TableDefinition<LeadRow, Omit<LeadRow, "id" | "created_at" | "converted_at" | "converted_client_id"> & Partial<Pick<LeadRow, "id" | "created_at" | "converted_at" | "converted_client_id">>, Partial<Omit<LeadRow, "id" | "user_id" | "property_id" | "created_at">>>;
      property_submissions: TableDefinition<PropertySubmissionRow, Omit<PropertySubmissionRow, "id" | "created_at" | "user_id"> & Partial<Pick<PropertySubmissionRow, "id" | "created_at" | "user_id">>, Partial<Omit<PropertySubmissionRow, "id" | "created_at">>>;
      client_stage_history: TableDefinition<ClientStageHistoryRow, Omit<ClientStageHistoryRow, "id" | "changed_at"> & Partial<Pick<ClientStageHistoryRow, "id" | "changed_at">>, never>;
      organization_settings: TableDefinition<OrganizationSettingsRow, Omit<OrganizationSettingsRow, "id" | "created_at" | "updated_at"> & Partial<Pick<OrganizationSettingsRow, "id" | "created_at" | "updated_at">>, Partial<Omit<OrganizationSettingsRow, "id" | "user_id" | "created_at">>>;
    };
    Views: Record<string, never>;
    Enums: {
      client_stage: ClientStageCode;
      interaction_type: InteractionType;
      follow_up_status: FollowUpDatabaseStatus;
      property_purpose: PropertyPurpose;
      property_status: PropertyStatus;
      appointment_status: AppointmentStatus;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      lead_status: LeadStatus;
      property_submission_status: PropertySubmissionStatus;
    };
    Functions: {
      submit_property_lead: { Args: { p_slug: string; p_name: string; p_phone: string; p_whatsapp: string; p_email: string; p_message: string }; Returns: string };
      submit_property_submission: { Args: { p_owner_name: string; p_phone: string; p_email: string; p_purpose: PropertyPurpose; p_property_type: string; p_neighborhood: string; p_city: string; p_desired_price: number | null; p_description: string }; Returns: string };
      convert_lead_to_client: { Args: { p_lead_id: string }; Returns: string };
    };
    CompositeTypes: Record<string, never>;
  };
}
