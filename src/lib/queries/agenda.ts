import { createClient } from "@/lib/supabase/server";
import { assignColumns, gridWindow, SLOT_MINUTES, toMinutes, type AgendaGrid } from "@/lib/agenda-layout";
import { dateKey, daysRangeLabel, timeLabel, weekdayColumnLabel, weekdayOf, weekOf } from "@/lib/dates";
import { ACTIVE_APPOINTMENT_STATUSES, APPOINTMENT_STATUS_LABEL } from "@/lib/domain";
import type { AppointmentStatus, CareType } from "@/types/database";

export type { AgendaGrid };

export type AgendaAppointment = {
  id: string;
  dayIndex: number;
  /** Minutos desde a meia-noite, no fuso da clínica. */
  startMinutes: number;
  durationMinutes: number;
  start: string;
  end: string;
  /** Coluna dentro do grupo de atendimentos sobrepostos, e o tamanho do grupo. */
  column: number;
  columnCount: number;
  patientId: string;
  patient: string;
  procedure: string;
  professional: string;
  careType: CareType;
  status: AppointmentStatus;
  statusLabel: string;
  expectedValue: number;
};

export type AgendaBlock = {
  id: string;
  dayIndex: number;
  startMinutes: number;
  durationMinutes: number;
  start: string;
  reason: string;
};

export type AgendaFilters = {
  weekOffset?: number;
  careType?: CareType | null;
  professionalId?: string | null;
};

export type AgendaData = {
  weekLabel: string;
  weekOffset: number;
  days: { date: string; label: string; isToday: boolean }[];
  grid: AgendaGrid;
  professionals: { id: string; full_name: string }[];
  appointments: AgendaAppointment[];
  blocks: AgendaBlock[];
  summary: {
    todayTotal: number;
    confirmed: number;
    confirmedShare: number;
    privateCount: number;
    privateValue: number;
    insuranceCount: number;
    insuranceCompanies: number;
  };
};

type AppointmentJoin = {
  id: string;
  start_at: string;
  end_at: string;
  care_type: CareType;
  status: AppointmentStatus;
  expected_value: number | null;
  insurance_company_id: string | null;
  patient_id: string;
  professional_id: string;
  patients: { full_name: string } | null;
  professionals: { full_name: string } | null;
  procedures: { name: string } | null;
};

/** Minutos desde a meia-noite do instante, já no fuso da clínica. */
function minutesOfDay(iso: string, timezone: string): number {
  return toMinutes(timeLabel(iso, timezone));
}

export async function getAgendaData(
  clinicId: string,
  timezone: string,
  filters: AgendaFilters = {},
): Promise<AgendaData> {
  const supabase = await createClient();
  const weekOffset = filters.weekOffset ?? 0;
  const week = weekOf(new Date(), timezone, weekOffset);
  const todayKey = dateKey(new Date(), timezone);

  const appointmentsQuery = supabase
    .from("appointments")
    .select(
      "id, start_at, end_at, care_type, status, expected_value, insurance_company_id, patient_id, professional_id, patients(full_name), professionals(full_name), procedures(name)",
    )
    .eq("clinic_id", clinicId)
    .gte("start_at", week.start.toISOString())
    .lte("start_at", week.end.toISOString())
    .order("start_at", { ascending: true });

  if (filters.careType) appointmentsQuery.eq("care_type", filters.careType);
  if (filters.professionalId) appointmentsQuery.eq("professional_id", filters.professionalId);

  const schedulesQuery = supabase
    .from("professional_schedules")
    .select("professional_id, weekday, start_time, end_time")
    .eq("clinic_id", clinicId)
    .eq("active", true);

  if (filters.professionalId) schedulesQuery.eq("professional_id", filters.professionalId);

  const [professionalsResult, appointmentsResult, blocksResult, schedulesResult] = await Promise.all([
    supabase
      .from("professionals")
      .select("id, full_name")
      .eq("clinic_id", clinicId)
      .eq("active", true)
      .order("full_name"),
    appointmentsQuery,
    supabase
      .from("calendar_blocks")
      .select("id, start_at, end_at, reason, professional_id")
      .eq("clinic_id", clinicId)
      .gte("start_at", week.start.toISOString())
      .lte("start_at", week.end.toISOString()),
    schedulesQuery,
  ]);

  if (professionalsResult.error) throw professionalsResult.error;
  if (appointmentsResult.error) throw appointmentsResult.error;
  if (blocksResult.error) throw blocksResult.error;
  if (schedulesResult.error) throw schedulesResult.error;

  const rows = (appointmentsResult.data ?? []) as unknown as AppointmentJoin[];
  const blockRows = (blocksResult.data ?? []).filter(
    (row) => !filters.professionalId || row.professional_id === filters.professionalId,
  );
  const schedules = schedulesResult.data ?? [];

  /*
   * Colunas exibidas: os dias úteis sempre, e o fim de semana só quando há
   * expediente cadastrado ou algo marcado — assim sábado aparece na clínica que
   * atende no sábado, sem poluir a grade das outras.
   */
  const busyDates = new Set([
    ...rows.map((row) => dateKey(new Date(row.start_at), timezone)),
    ...blockRows.map((row) => dateKey(new Date(row.start_at), timezone)),
  ]);
  const scheduledWeekdays = new Set(schedules.map((schedule) => schedule.weekday));

  const visibleDays = week.days.filter((date, index) => {
    if (index < 5) return true;
    return scheduledWeekdays.has(weekdayOf(date)) || busyDates.has(date);
  });

  const dayIndexOf = (iso: string) => visibleDays.indexOf(dateKey(new Date(iso), timezone));

  const appointments: AgendaAppointment[] = rows
    .map((row) => ({
      id: row.id,
      dayIndex: dayIndexOf(row.start_at),
      startMinutes: minutesOfDay(row.start_at, timezone),
      durationMinutes: Math.max(
        SLOT_MINUTES / 2,
        (new Date(row.end_at).getTime() - new Date(row.start_at).getTime()) / 60000,
      ),
      start: timeLabel(row.start_at, timezone),
      end: timeLabel(row.end_at, timezone),
      column: 0,
      columnCount: 1,
      patientId: row.patient_id,
      patient: row.patients?.full_name ?? "Paciente",
      procedure: row.procedures?.name ?? "Atendimento",
      professional: row.professionals?.full_name ?? "",
      careType: row.care_type,
      status: row.status,
      statusLabel: APPOINTMENT_STATUS_LABEL[row.status],
      expectedValue: Number(row.expected_value ?? 0),
    }))
    .filter((item) => item.dayIndex >= 0);

  assignColumns(appointments);

  const blocks: AgendaBlock[] = blockRows
    .map((row) => ({
      id: row.id,
      dayIndex: dayIndexOf(row.start_at),
      startMinutes: minutesOfDay(row.start_at, timezone),
      durationMinutes: Math.max(
        SLOT_MINUTES / 2,
        (new Date(row.end_at).getTime() - new Date(row.start_at).getTime()) / 60000,
      ),
      start: timeLabel(row.start_at, timezone),
      reason: row.reason ?? "Bloqueado",
    }))
    .filter((item) => item.dayIndex >= 0);

  const grid = gridWindow(schedules, [...appointments, ...blocks]);

  const active = appointments.filter((item) => ACTIVE_APPOINTMENT_STATUSES.includes(item.status));
  const todayIndex = visibleDays.indexOf(todayKey);
  const todayItems = todayIndex >= 0 ? active.filter((item) => item.dayIndex === todayIndex) : [];
  const confirmed = todayItems.filter((item) => item.status === "confirmed" || item.status === "completed");
  const privateItems = active.filter((item) => item.careType === "private");
  const insuranceItems = rows.filter(
    (row) => row.care_type === "insurance" && ACTIVE_APPOINTMENT_STATUSES.includes(row.status),
  );

  return {
    weekLabel: daysRangeLabel(visibleDays, timezone),
    weekOffset,
    days: visibleDays.map((date) => ({
      date,
      label: weekdayColumnLabel(date, timezone),
      isToday: date === todayKey,
    })),
    grid,
    professionals: professionalsResult.data ?? [],
    appointments,
    blocks,
    summary: {
      todayTotal: todayItems.length,
      confirmed: confirmed.length,
      confirmedShare: todayItems.length ? Math.round((confirmed.length / todayItems.length) * 100) : 0,
      privateCount: privateItems.length,
      privateValue: privateItems.reduce((total, item) => total + item.expectedValue, 0),
      insuranceCount: insuranceItems.length,
      insuranceCompanies: new Set(insuranceItems.map((row) => row.insurance_company_id).filter(Boolean)).size,
    },
  };
}

/** Listas usadas pelo formulário de novo agendamento. */
export async function getSchedulingCatalogs(clinicId: string) {
  const supabase = await createClient();

  const [professionals, procedures, insuranceCompanies] = await Promise.all([
    supabase.from("professionals").select("id, full_name").eq("clinic_id", clinicId).eq("active", true).order("full_name"),
    supabase
      .from("procedures")
      .select("id, name, default_duration_minutes, private_price")
      .eq("clinic_id", clinicId)
      .eq("active", true)
      .order("name"),
    supabase.from("insurance_companies").select("id, name").eq("clinic_id", clinicId).eq("active", true).order("name"),
  ]);

  if (professionals.error) throw professionals.error;
  if (procedures.error) throw procedures.error;
  if (insuranceCompanies.error) throw insuranceCompanies.error;

  return {
    professionals: professionals.data ?? [],
    procedures: (procedures.data ?? []).map((row) => ({
      ...row,
      private_price: row.private_price === null ? null : Number(row.private_price),
    })),
    insuranceCompanies: insuranceCompanies.data ?? [],
  };
}
