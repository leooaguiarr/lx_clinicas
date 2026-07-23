import { createClient } from "@/lib/supabase/server";
import { dateKey } from "@/lib/dates";
import type { AppointmentStatus } from "@/types/database";

const PERIOD_DAYS = 30;

export type ReportsData = {
  periodDays: number;
  occupancyRate: number;
  totalAppointments: number;
  noShowRate: number;
  noShowCount: number;
  fromAiAgent: number;
  aiAgentShare: number;
  byProfessional: { name: string; count: number; share: number }[];
};

function minutesBetween(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export async function getReportsData(clinicId: string, timezone: string): Promise<ReportsData> {
  const supabase = await createClient();

  const now = new Date();
  const periodStart = new Date(now.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const [appointmentsResult, schedulesResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, status, source, start_at, end_at, professional_id, professionals(full_name)")
      .eq("clinic_id", clinicId)
      .gte("start_at", periodStart.toISOString())
      .lte("start_at", now.toISOString()),
    supabase
      .from("professional_schedules")
      .select("weekday, start_time, end_time")
      .eq("clinic_id", clinicId)
      .eq("active", true),
  ]);

  if (appointmentsResult.error) throw appointmentsResult.error;
  if (schedulesResult.error) throw schedulesResult.error;

  type AppointmentJoin = {
    id: string;
    status: AppointmentStatus;
    source: string;
    start_at: string;
    end_at: string;
    professional_id: string;
    professionals: { full_name: string } | null;
  };

  const rows = (appointmentsResult.data ?? []) as unknown as AppointmentJoin[];
  const total = rows.length;
  const noShows = rows.filter((row) => row.status === "no_show").length;
  const aiAgent = rows.filter((row) => row.source === "ai_agent").length;

  // Ocupação = minutos agendados ÷ minutos de agenda disponíveis no período.
  const weekdayOccurrences = new Map<number, number>();
  for (let offset = 0; offset < PERIOD_DAYS; offset += 1) {
    const day = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    const [year, month, date] = dateKey(day, timezone).split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay();
    weekdayOccurrences.set(weekday, (weekdayOccurrences.get(weekday) ?? 0) + 1);
  }

  const availableMinutes = (schedulesResult.data ?? []).reduce((total, schedule) => {
    const occurrences = weekdayOccurrences.get(schedule.weekday) ?? 0;
    return total + minutesBetween(schedule.start_time, schedule.end_time) * occurrences;
  }, 0);

  const bookedMinutes = rows
    .filter((row) => row.status !== "cancelled")
    .reduce((total, row) => total + (new Date(row.end_at).getTime() - new Date(row.start_at).getTime()) / 60000, 0);

  const byProfessionalMap = new Map<string, number>();
  for (const row of rows) {
    const name = row.professionals?.full_name ?? "Sem profissional";
    byProfessionalMap.set(name, (byProfessionalMap.get(name) ?? 0) + 1);
  }
  const topCount = Math.max(1, ...byProfessionalMap.values());

  return {
    periodDays: PERIOD_DAYS,
    occupancyRate: availableMinutes > 0 ? Math.round((bookedMinutes / availableMinutes) * 100) : 0,
    totalAppointments: total,
    noShowRate: total > 0 ? Math.round((noShows / total) * 1000) / 10 : 0,
    noShowCount: noShows,
    fromAiAgent: aiAgent,
    aiAgentShare: total > 0 ? Math.round((aiAgent / total) * 100) : 0,
    byProfessional: [...byProfessionalMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, share: Math.round((count / topCount) * 100) })),
  };
}
