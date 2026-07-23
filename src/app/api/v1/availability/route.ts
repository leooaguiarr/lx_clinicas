import { z } from "zod";
import { uuidSchema } from "@/lib/validation";
import { getClinicSettings } from "@/lib/api/appointments";
import { fail, failFromZod, ok } from "@/lib/api/http";
import { authenticateRequest } from "@/lib/api/tokens";
import { zonedDateTime } from "@/lib/dates";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/domain";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD"),
  days: z.coerce.number().int().min(1).max(14).default(1),
  professional_id: uuidSchema.optional(),
  procedure_id: uuidSchema.optional(),
});

type Range = { start: number; end: number };

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function addDays(date: string, amount: number): string {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + amount);
  return base.toISOString().slice(0, 10);
}

/** Dia da semana da data-calendário (0 = domingo), independente de fuso. */
function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/**
 * GET /api/v1/availability?date=2026-07-24&days=3&professional_id=...
 *
 * Horários livres por profissional: grade de professional_schedules menos
 * agendamentos ativos e bloqueios. Slots no passado não aparecem.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request, "availability:read");
  if (!auth.ok) return fail(auth.status, auth.code, auth.message);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return failFromZod(parsed.error);

  const { date, days, professional_id, procedure_id } = parsed.data;
  const { clinicId } = auth.auth;
  const admin = createAdminClient();
  const { timezone, defaultMinutes } = await getClinicSettings(clinicId);

  const dates = Array.from({ length: days }, (_, index) => addDays(date, index));
  const rangeStart = zonedDateTime(dates[0], "00:00", timezone);
  const rangeEnd = zonedDateTime(addDays(dates[dates.length - 1], 1), "00:00", timezone);

  let professionalsQuery = admin
    .from("professionals")
    .select("id, full_name")
    .eq("clinic_id", clinicId)
    .eq("active", true)
    .order("full_name");
  if (professional_id) professionalsQuery = professionalsQuery.eq("id", professional_id);

  const [professionalsResult, schedulesResult, appointmentsResult, blocksResult, procedureResult] = await Promise.all([
    professionalsQuery,
    admin.from("professional_schedules").select("professional_id, weekday, start_time, end_time, appointment_interval_minutes").eq("clinic_id", clinicId).eq("active", true),
    admin
      .from("appointments")
      .select("professional_id, start_at, end_at")
      .eq("clinic_id", clinicId)
      .in("status", ACTIVE_APPOINTMENT_STATUSES)
      .lt("start_at", rangeEnd.toISOString())
      .gt("end_at", rangeStart.toISOString()),
    admin
      .from("calendar_blocks")
      .select("professional_id, start_at, end_at")
      .eq("clinic_id", clinicId)
      .lt("start_at", rangeEnd.toISOString())
      .gt("end_at", rangeStart.toISOString()),
    procedure_id
      ? admin.from("procedures").select("default_duration_minutes").eq("clinic_id", clinicId).eq("id", procedure_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (professionalsResult.error) return fail(500, "query_error", "Falha ao consultar profissionais.");
  const professionals = professionalsResult.data ?? [];
  if (professional_id && professionals.length === 0) {
    return fail(404, "professional_not_found", "Profissional não encontrado nesta clínica.");
  }

  const slotMinutes = procedureResult.data?.default_duration_minutes ?? defaultMinutes;
  const now = Date.now();

  const busy = new Map<string, Range[]>();
  const addBusy = (professionalId: string, startIso: string, endIso: string) => {
    const list = busy.get(professionalId) ?? [];
    list.push({ start: new Date(startIso).getTime(), end: new Date(endIso).getTime() });
    busy.set(professionalId, list);
  };
  for (const row of appointmentsResult.data ?? []) addBusy(row.professional_id, row.start_at, row.end_at);
  for (const row of blocksResult.data ?? []) addBusy(row.professional_id, row.start_at, row.end_at);

  const result = dates.map((day) => {
    const weekday = weekdayOf(day);
    return {
      date: day,
      professionals: professionals.map((professional) => {
        const daySchedules = (schedulesResult.data ?? []).filter(
          (schedule) => schedule.professional_id === professional.id && schedule.weekday === weekday,
        );
        const busyRanges = busy.get(professional.id) ?? [];
        const slots: { start_at: string; end_at: string; time: string }[] = [];

        for (const schedule of daySchedules) {
          const step = schedule.appointment_interval_minutes || slotMinutes;
          const open = toMinutes(schedule.start_time);
          const close = toMinutes(schedule.end_time);

          for (let cursor = open; cursor + slotMinutes <= close; cursor += step) {
            const start = zonedDateTime(day, toTime(cursor), timezone);
            const end = new Date(start.getTime() + slotMinutes * 60000);
            if (start.getTime() <= now) continue;
            const overlaps = busyRanges.some((range) => start.getTime() < range.end && range.start < end.getTime());
            if (overlaps) continue;
            slots.push({ start_at: start.toISOString(), end_at: end.toISOString(), time: toTime(cursor) });
          }
        }

        return { professional_id: professional.id, professional_name: professional.full_name, slots };
      }),
    };
  });

  return ok({ timezone, slot_minutes: slotMinutes, days: result });
}
