/**
 * Tipos do banco, derivados do schema que já existe na instância
 * (conferido via OpenAPI do PostgREST).
 *
 * Para regenerar quando houver acesso direto ao Postgres:
 *   npx supabase gen types typescript --db-url "$DATABASE_URL" > src/types/database.ts
 */

export type ClinicRole = "admin" | "reception" | "professional" | "finance";
export type MemberStatus = "active" | "invited" | "inactive";
export type CareType = "private" | "insurance";
export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
export type AppointmentSource = "reception" | "whatsapp" | "ai_agent" | "booking_link" | "professional" | "import";
export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "paid" | "partial" | "overdue" | "cancelled";
export type PaymentMethod = "cash" | "pix" | "debit_card" | "credit_card" | "bank_slip" | "insurance" | "other";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type ClinicRow = Timestamps & {
  id: string;
  name: string;
  legal_name: string | null;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  main_specialty: string | null;
  timezone: string;
  default_appointment_minutes: number;
  status: string;
};

export type ProfileRow = Timestamps & {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
};

export type ClinicMemberRow = {
  id: string;
  clinic_id: string;
  user_id: string;
  role: ClinicRole;
  status: MemberStatus;
  created_at: string;
};

export type ProfessionalRow = Timestamps & {
  id: string;
  clinic_id: string;
  user_id: string | null;
  full_name: string;
  specialty: string | null;
  council_type: string | null;
  council_number: string | null;
  phone: string | null;
  email: string | null;
  calendar_color: string | null;
  active: boolean;
};

export type InsuranceCompanyRow = Timestamps & {
  id: string;
  clinic_id: string;
  name: string;
  registration_code: string | null;
  average_payment_days: number | null;
  notes: string | null;
  active: boolean;
};

export type InsurancePlanRow = Timestamps & {
  id: string;
  clinic_id: string;
  insurance_company_id: string;
  name: string;
  active: boolean;
};

export type PatientRow = Timestamps & {
  id: string;
  clinic_id: string;
  full_name: string;
  normalized_phone: string;
  phone_display: string | null;
  birth_date: string | null;
  cpf: string | null;
  email: string | null;
  gender: string | null;
  insurance_company_id: string | null;
  insurance_plan_id: string | null;
  insurance_card_number: string | null;
  insurance_card_expiration: string | null;
  main_professional_id: string | null;
  communication_consent: boolean;
  notes: string | null;
  source: string | null;
  active: boolean;
};

export type ProcedureRow = Timestamps & {
  id: string;
  clinic_id: string;
  name: string;
  category: string | null;
  default_duration_minutes: number;
  private_price: number | null;
  active: boolean;
};

export type ProfessionalScheduleRow = {
  id: string;
  clinic_id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  appointment_interval_minutes: number;
  active: boolean;
};

export type CalendarBlockRow = {
  id: string;
  clinic_id: string;
  professional_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

export type AppointmentRow = Timestamps & {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  procedure_id: string | null;
  insurance_company_id: string | null;
  insurance_plan_id: string | null;
  care_type: CareType;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  expected_value: number | null;
  received_value: number | null;
  source: AppointmentSource;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  previous_appointment_id: string | null;
  idempotency_key: string | null;
  chatwoot_contact_id: string | null;
  chatwoot_conversation_id: string | null;
  n8n_execution_id: string | null;
  created_by: string | null;
  updated_by: string | null;
};

export type FinancialTransactionRow = Timestamps & {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  appointment_id: string | null;
  professional_id: string | null;
  type: TransactionType;
  category: string | null;
  description: string;
  amount: number;
  due_date: string | null;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  status: TransactionStatus;
  supplier: string | null;
  recurring: boolean;
  notes: string | null;
  created_by: string | null;
};

/** Procedimentos que cada profissional executa. Chave composta, sem id. */
export type ProfessionalProcedureRow = {
  clinic_id: string;
  professional_id: string;
  procedure_id: string;
};

/** Tabela de preços por convênio/plano. */
export type ProcedureInsurancePriceRow = Timestamps & {
  id: string;
  clinic_id: string;
  procedure_id: string;
  insurance_company_id: string;
  insurance_plan_id: string | null;
  price: number;
  duration_minutes: number | null;
  requires_authorization: boolean;
  internal_code: string | null;
};

/** Tokens de integração por clínica (n8n, Chatwoot, agente de IA). */
export type IntegrationTokenRow = {
  id: string;
  clinic_id: string;
  name: string;
  token_hash: string;
  token_prefix: string;
  scopes: string[];
  active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  revoked_at: string | null;
};

export type AuditLogRow = {
  id: string;
  clinic_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: unknown | null;
  new_data: unknown | null;
  ip_address: string | null;
  created_at: string;
};

/** Campos gerados pelo banco, opcionais em INSERT. */
type Generated = "id" | "created_at" | "updated_at";

/** Colunas anuláveis também são opcionais em INSERT — o default é null. */
type NullableKeys<Row> = { [K in keyof Row]-?: null extends Row[K] ? K : never }[keyof Row];

type TableDef<Row, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Extract<Generated | Optional | NullableKeys<Row>, keyof Row>> &
    Partial<Pick<Row, Extract<Generated | Optional | NullableKeys<Row>, keyof Row>>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      clinics: TableDef<ClinicRow, "timezone" | "status" | "default_appointment_minutes">;
      profiles: TableDef<ProfileRow>;
      clinic_members: TableDef<ClinicMemberRow, "status">;
      professionals: TableDef<ProfessionalRow, "active">;
      insurance_companies: TableDef<InsuranceCompanyRow, "active">;
      insurance_plans: TableDef<InsurancePlanRow, "active">;
      patients: TableDef<PatientRow, "active" | "communication_consent">;
      procedures: TableDef<ProcedureRow, "active" | "default_duration_minutes">;
      professional_schedules: TableDef<ProfessionalScheduleRow, "active" | "appointment_interval_minutes">;
      calendar_blocks: TableDef<CalendarBlockRow>;
      appointments: TableDef<AppointmentRow, "status" | "source" | "received_value">;
      financial_transactions: TableDef<FinancialTransactionRow, "status" | "recurring">;
      professional_procedures: TableDef<ProfessionalProcedureRow>;
      procedure_insurance_prices: TableDef<ProcedureInsurancePriceRow, "requires_authorization">;
      integration_tokens: TableDef<IntegrationTokenRow, "active" | "scopes">;
      audit_logs: TableDef<AuditLogRow>;
    };
    Views: Record<never, never>;
    Functions: {
      user_clinic_ids: { Args: Record<never, never>; Returns: string[] };
      has_clinic_access: { Args: { target_clinic: string }; Returns: boolean };
      has_clinic_role: { Args: { target_clinic: string; allowed_roles: string[] }; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
