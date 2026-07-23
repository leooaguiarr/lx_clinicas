import { createClient } from "@/lib/supabase/server";
import { currentMonthRange, dateLabel, shortDateTimeLabel } from "@/lib/dates";
import { ACTIVE_APPOINTMENT_STATUSES, APPOINTMENT_STATUS_LABEL, CARE_TYPE_LABEL, formatPhone } from "@/lib/domain";
import type { AppointmentStatus, TransactionStatus } from "@/types/database";

const OPEN_TRANSACTION_STATUSES: TransactionStatus[] = ["pending", "partial", "overdue"];
const PAGE_SIZE = 25;

export type PatientListItem = {
  id: string;
  name: string;
  phone: string;
  last: string;
  next: string;
  professional: string;
  type: string;
  insurance: string;
  balance: number;
  status: "Ativo" | "Pendente" | "Inativo";
};

export type PatientListResult = {
  items: PatientListItem[];
  total: number;
  summary: { active: number; newThisMonth: number; withUpcoming: number; withDebt: number };
};

/**
 * Agrega, para cada paciente, a última e a próxima consulta e o saldo em aberto.
 * Três consultas no total — evita N+1 resolvendo os agregados em memória sobre
 * o conjunto já paginado de pacientes.
 */
export async function listPatients(
  clinicId: string,
  timezone: string,
  options: { search?: string; careType?: string; page?: number } = {},
): Promise<PatientListResult> {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("patients")
    .select(
      "id, full_name, normalized_phone, phone_display, active, created_at, insurance_company_id, insurance_companies(name), professionals!patients_main_professional_id_fkey(full_name)",
      { count: "exact" },
    )
    .eq("clinic_id", clinicId)
    .order("full_name")
    .range(from, from + PAGE_SIZE - 1);

  if (options.search) {
    const term = options.search.trim();
    const digits = term.replace(/\D/g, "");
    query = digits.length >= 3
      ? query.or(`full_name.ilike.%${term}%,normalized_phone.ilike.%${digits}%`)
      : query.ilike("full_name", `%${term}%`);
  }

  if (options.careType === "private") query = query.is("insurance_company_id", null);
  if (options.careType === "insurance") query = query.not("insurance_company_id", "is", null);

  const { data, count, error } = await query;
  if (error) throw error;

  type PatientJoin = {
    id: string;
    full_name: string;
    normalized_phone: string;
    phone_display: string | null;
    active: boolean;
    created_at: string;
    insurance_company_id: string | null;
    insurance_companies: { name: string } | null;
    professionals: { full_name: string } | null;
  };

  const rows = (data ?? []) as unknown as PatientJoin[];
  const ids = rows.map((row) => row.id);

  const [appointmentsResult, transactionsResult, summary] = await Promise.all([
    ids.length
      ? supabase
          .from("appointments")
          .select("patient_id, start_at, status")
          .eq("clinic_id", clinicId)
          .in("patient_id", ids)
          .in("status", ACTIVE_APPOINTMENT_STATUSES)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? supabase
          .from("financial_transactions")
          .select("patient_id, amount")
          .eq("clinic_id", clinicId)
          .eq("type", "income")
          .in("patient_id", ids)
          .in("status", OPEN_TRANSACTION_STATUSES)
      : Promise.resolve({ data: [], error: null }),
    getPatientsSummary(clinicId, timezone),
  ]);

  if (appointmentsResult.error) throw appointmentsResult.error;
  if (transactionsResult.error) throw transactionsResult.error;

  const now = Date.now();
  const lastByPatient = new Map<string, string>();
  const nextByPatient = new Map<string, string>();

  for (const item of appointmentsResult.data ?? []) {
    const at = new Date(item.start_at).getTime();
    if (at <= now) {
      const current = lastByPatient.get(item.patient_id);
      if (!current || new Date(current).getTime() < at) lastByPatient.set(item.patient_id, item.start_at);
    } else {
      const current = nextByPatient.get(item.patient_id);
      if (!current || new Date(current).getTime() > at) nextByPatient.set(item.patient_id, item.start_at);
    }
  }

  const balanceByPatient = new Map<string, number>();
  for (const item of transactionsResult.data ?? []) {
    if (!item.patient_id) continue;
    balanceByPatient.set(item.patient_id, (balanceByPatient.get(item.patient_id) ?? 0) + Number(item.amount));
  }

  const items = rows.map((row): PatientListItem => {
    const balance = balanceByPatient.get(row.id) ?? 0;
    return {
      id: row.id,
      name: row.full_name,
      phone: row.phone_display ?? formatPhone(row.normalized_phone),
      last: dateLabel(lastByPatient.get(row.id) ?? null, timezone),
      next: shortDateTimeLabel(nextByPatient.get(row.id) ?? null, timezone),
      professional: row.professionals?.full_name ?? "—",
      type: row.insurance_company_id ? CARE_TYPE_LABEL.insurance : CARE_TYPE_LABEL.private,
      insurance: row.insurance_companies?.name ?? "—",
      balance,
      status: !row.active ? "Inativo" : balance > 0 ? "Pendente" : "Ativo",
    };
  });

  return { items, total: count ?? items.length, summary };
}

async function getPatientsSummary(clinicId: string, timezone: string) {
  const supabase = await createClient();
  const month = currentMonthRange(new Date(), timezone);
  const nowIso = new Date().toISOString();

  const [active, newThisMonth, upcoming, debts] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("active", true),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("created_at", month.start.toISOString())
      .lt("created_at", month.end.toISOString()),
    supabase
      .from("appointments")
      .select("patient_id")
      .eq("clinic_id", clinicId)
      .gte("start_at", nowIso)
      .in("status", ACTIVE_APPOINTMENT_STATUSES),
    supabase
      .from("financial_transactions")
      .select("patient_id")
      .eq("clinic_id", clinicId)
      .eq("type", "income")
      .not("patient_id", "is", null)
      .in("status", OPEN_TRANSACTION_STATUSES),
  ]);

  return {
    active: active.count ?? 0,
    newThisMonth: newThisMonth.count ?? 0,
    withUpcoming: new Set((upcoming.data ?? []).map((item) => item.patient_id)).size,
    withDebt: new Set((debts.data ?? []).map((item) => item.patient_id)).size,
  };
}

/**
 * Pacientes para o select do drawer de agendamento.
 * Limite de 500 — acima disso vale trocar por busca assíncrona.
 */
export async function listPatientOptions(clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, full_name, phone_display")
    .eq("clinic_id", clinicId)
    .eq("active", true)
    .order("full_name")
    .limit(500);

  if (error) throw error;
  return data ?? [];
}

export type PatientDetail = {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  birthDate: string;
  insurance: string;
  careType: string;
  createdAt: string;
  status: "Ativo" | "Pendente" | "Inativo";
  nextAppointment: { date: string; procedure: string; professional: string } | null;
  stats: { total: number; last: string; noShows: number; cancellations: number; balance: number };
  appointments: { id: string; when: string; procedure: string; professional: string; status: string }[];
};

export async function getPatientDetail(
  clinicId: string,
  patientId: string,
  timezone: string,
): Promise<PatientDetail | null> {
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select(
      "id, full_name, normalized_phone, phone_display, email, cpf, birth_date, active, created_at, insurance_company_id, insurance_companies(name)",
    )
    .eq("clinic_id", clinicId)
    .eq("id", patientId)
    .maybeSingle();

  if (error) throw error;
  if (!patient) return null;

  const [appointmentsResult, transactionsResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, start_at, status, professionals(full_name), procedures(name)")
      .eq("clinic_id", clinicId)
      .eq("patient_id", patientId)
      .order("start_at", { ascending: false }),
    supabase
      .from("financial_transactions")
      .select("amount")
      .eq("clinic_id", clinicId)
      .eq("patient_id", patientId)
      .eq("type", "income")
      .in("status", OPEN_TRANSACTION_STATUSES),
  ]);

  if (appointmentsResult.error) throw appointmentsResult.error;

  type AppointmentJoin = {
    id: string;
    start_at: string;
    status: AppointmentStatus;
    professionals: { full_name: string } | null;
    procedures: { name: string } | null;
  };

  const appointments = (appointmentsResult.data ?? []) as unknown as AppointmentJoin[];
  const now = Date.now();
  const upcoming = [...appointments]
    .reverse()
    .find((item) => new Date(item.start_at).getTime() > now && ACTIVE_APPOINTMENT_STATUSES.includes(item.status));
  const past = appointments.find((item) => new Date(item.start_at).getTime() <= now && item.status === "completed");

  // O financeiro é invisível para o perfil "professional" (RLS bloqueia o SELECT).
  const balance = (transactionsResult.data ?? []).reduce((total, item) => total + Number(item.amount), 0);
  const insurance = (patient.insurance_companies as unknown as { name: string } | null)?.name ?? "—";

  return {
    id: patient.id,
    name: patient.full_name,
    phone: patient.phone_display ?? formatPhone(patient.normalized_phone),
    email: patient.email ?? "—",
    cpf: patient.cpf ?? "—",
    birthDate: dateLabel(patient.birth_date ? `${patient.birth_date}T12:00:00Z` : null, timezone),
    insurance,
    careType: patient.insurance_company_id ? CARE_TYPE_LABEL.insurance : CARE_TYPE_LABEL.private,
    createdAt: dateLabel(patient.created_at, timezone),
    status: !patient.active ? "Inativo" : balance > 0 ? "Pendente" : "Ativo",
    nextAppointment: upcoming
      ? {
          date: shortDateTimeLabel(upcoming.start_at, timezone),
          procedure: upcoming.procedures?.name ?? "Atendimento",
          professional: upcoming.professionals?.full_name ?? "—",
        }
      : null,
    stats: {
      total: appointments.filter((item) => item.status === "completed").length,
      last: dateLabel(past?.start_at ?? null, timezone),
      noShows: appointments.filter((item) => item.status === "no_show").length,
      cancellations: appointments.filter((item) => item.status === "cancelled").length,
      balance,
    },
    appointments: appointments.slice(0, 20).map((item) => ({
      id: item.id,
      when: shortDateTimeLabel(item.start_at, timezone),
      procedure: item.procedures?.name ?? "Atendimento",
      professional: item.professionals?.full_name ?? "—",
      status: APPOINTMENT_STATUS_LABEL[item.status],
    })),
  };
}
