import type {
  AppointmentSource,
  AppointmentStatus,
  CareType,
  ClinicRole,
  PaymentMethod,
  TransactionStatus,
} from "@/types/database";

/** O banco guarda os enums em inglês; a interface é toda em pt-BR. */

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Atendido",
  cancelled: "Cancelado",
  no_show: "Faltou",
};

export const CARE_TYPE_LABEL: Record<CareType, string> = {
  private: "Particular",
  insurance: "Convênio",
};

export const APPOINTMENT_SOURCE_LABEL: Record<AppointmentSource, string> = {
  reception: "Recepção",
  whatsapp: "WhatsApp",
  ai_agent: "Agente de IA",
  booking_link: "Link de agendamento",
  professional: "Profissional",
  import: "Importação",
};

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  partial: "Parcial",
  overdue: "Em atraso",
  cancelled: "Cancelado",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit_card: "Débito",
  credit_card: "Crédito",
  bank_slip: "Boleto",
  insurance: "Convênio",
  other: "Outro",
};

export const ROLE_LABEL: Record<ClinicRole, string> = {
  admin: "Administrador",
  reception: "Recepção",
  professional: "Profissional",
  finance: "Financeiro",
};

/** Quem enxerga o módulo financeiro. O profissional não (seção 5.3 da SPEC). */
export const FINANCE_ROLES: ClinicRole[] = ["admin", "reception", "finance"];

/** Agendamentos cancelados/faltas não ocupam horário nem entram nos totais. */
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = ["scheduled", "confirmed", "completed"];

/**
 * Telefone brasileiro para o formato E.164 sem "+", usado em
 * patients.normalized_phone (chave de deduplicação junto com clinic_id).
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

/** "5535999128432" → "(35) 99912-8432" */
export function formatPhone(normalized: string | null): string {
  if (!normalized) return "—";
  const digits = normalized.replace(/\D/g, "").replace(/^55/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return normalized;
}
