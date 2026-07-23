import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { zonedDateTime } from "@/lib/dates";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/domain";

/** Regras compartilhadas pelos endpoints de agendamento. */

const ISO_WITH_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Aceita ISO com fuso explícito ("2026-07-24T14:00:00-03:00") ou o par
 * date+time interpretado no fuso da clínica. ISO sem fuso é rejeitado — no
 * servidor (UTC) ele mudaria o horário silenciosamente.
 */
export function resolveInstant(
  input: { iso?: string | null; date?: string | null; time?: string | null },
  timezone: string,
): Date | { error: string } {
  if (input.iso) {
    if (!ISO_WITH_OFFSET.test(input.iso)) {
      return { error: "Use fuso explícito no ISO (ex.: 2026-07-24T14:00:00-03:00) ou os campos date + time." };
    }
    const parsed = new Date(input.iso);
    return Number.isNaN(parsed.getTime()) ? { error: "Data/hora inválida." } : parsed;
  }
  if (input.date && input.time) {
    return zonedDateTime(input.date, input.time, timezone);
  }
  return { error: "Informe start_at (ISO com fuso) ou date + time." };
}

export type ConflictCheck =
  | { conflict: false }
  | { conflict: true; reason: "appointment" | "block"; detail: string };

/** Sobreposição com agendamentos ativos e bloqueios do profissional. */
export async function checkConflicts(
  clinicId: string,
  professionalId: string,
  start: Date,
  end: Date,
  ignoreAppointmentId?: string,
): Promise<ConflictCheck> {
  const admin = createAdminClient();
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  let appointmentsQuery = admin
    .from("appointments")
    .select("id, start_at, end_at")
    .eq("clinic_id", clinicId)
    .eq("professional_id", professionalId)
    .in("status", ACTIVE_APPOINTMENT_STATUSES)
    .lt("start_at", endIso)
    .gt("end_at", startIso)
    .limit(1);

  if (ignoreAppointmentId) appointmentsQuery = appointmentsQuery.neq("id", ignoreAppointmentId);

  const [{ data: appointments }, { data: blocks }] = await Promise.all([
    appointmentsQuery,
    admin
      .from("calendar_blocks")
      .select("id, reason")
      .eq("clinic_id", clinicId)
      .eq("professional_id", professionalId)
      .lt("start_at", endIso)
      .gt("end_at", startIso)
      .limit(1),
  ]);

  if (appointments?.length) {
    return { conflict: true, reason: "appointment", detail: "O profissional já tem atendimento nesse horário." };
  }
  if (blocks?.length) {
    return { conflict: true, reason: "block", detail: `Horário bloqueado${blocks[0].reason ? ` (${blocks[0].reason})` : ""}.` };
  }
  return { conflict: false };
}

export const APPOINTMENT_SELECT =
  "id, clinic_id, patient_id, professional_id, procedure_id, insurance_company_id, care_type, start_at, end_at, status, expected_value, received_value, source, notes, cancellation_reason, cancelled_at, idempotency_key, created_at, updated_at, patients(full_name, phone_display, normalized_phone), professionals(full_name), procedures(name)";

type Joined = {
  patients: { full_name: string; phone_display: string | null; normalized_phone: string } | null;
  professionals: { full_name: string } | null;
  procedures: { name: string } | null;
  [key: string]: unknown;
};

/** Achata os joins para o consumidor da API (n8n) não depender do formato do PostgREST. */
export function serializeAppointment(row: unknown) {
  const item = row as Joined;
  const { patients, professionals, procedures, ...rest } = item;
  return {
    ...rest,
    patient_name: patients?.full_name ?? null,
    patient_phone: patients?.phone_display ?? patients?.normalized_phone ?? null,
    professional_name: professionals?.full_name ?? null,
    procedure_name: procedures?.name ?? null,
  };
}

/** Fuso e duração padrão da clínica — usados por vários endpoints. */
export async function getClinicSettings(clinicId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("clinics")
    .select("timezone, default_appointment_minutes")
    .eq("id", clinicId)
    .maybeSingle();
  return {
    timezone: data?.timezone ?? "America/Sao_Paulo",
    defaultMinutes: data?.default_appointment_minutes ?? 30,
  };
}
