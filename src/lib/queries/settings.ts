import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { dateLabel, shortDateTimeLabel } from "@/lib/dates";
import type { ClinicRole } from "@/types/database";

export async function getClinic(clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select("id, name, legal_name, document, phone, whatsapp, email, timezone, default_appointment_minutes")
    .eq("id", clinicId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type ProfessionalDetail = {
  id: string;
  full_name: string;
  specialty: string | null;
  council_type: string | null;
  council_number: string | null;
  email: string | null;
  phone: string | null;
  calendar_color: string | null;
  active: boolean;
  schedules: {
    id?: string;
    weekday: number;
    start_time: string;
    end_time: string;
    appointment_interval_minutes: number;
    active: boolean;
  }[];
  procedure_ids: string[];
};

export async function listProfessionals(clinicId: string): Promise<ProfessionalDetail[]> {
  const supabase = await createClient();
  const [{ data: professionals, error: profError }, { data: schedules }, { data: profProcedures }] =
    await Promise.all([
      supabase
        .from("professionals")
        .select("id, full_name, specialty, council_type, council_number, email, phone, calendar_color, active")
        .eq("clinic_id", clinicId)
        .order("full_name"),
      supabase
        .from("professional_schedules")
        .select("id, professional_id, weekday, start_time, end_time, appointment_interval_minutes, active")
        .eq("clinic_id", clinicId)
        .order("weekday"),
      supabase
        .from("professional_procedures")
        .select("professional_id, procedure_id")
        .eq("clinic_id", clinicId),
    ]);

  if (profError) throw profError;

  const schedulesByProf = new Map<string, NonNullable<typeof schedules>>();
  for (const s of schedules ?? []) {
    const list = schedulesByProf.get(s.professional_id) ?? [];
    list.push(s);
    schedulesByProf.set(s.professional_id, list);
  }

  const proceduresByProf = new Map<string, string[]>();
  for (const p of profProcedures ?? []) {
    const list = proceduresByProf.get(p.professional_id) ?? [];
    list.push(p.procedure_id);
    proceduresByProf.set(p.professional_id, list);
  }

  return (professionals ?? []).map((prof) => ({
    ...prof,
    schedules: schedulesByProf.get(prof.id) ?? [],
    procedure_ids: proceduresByProf.get(prof.id) ?? [],
  }));
}

export async function listProcedures(clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .select("id, name, category, default_duration_minutes, private_price, active")
    .eq("clinic_id", clinicId)
    .order("name");

  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, private_price: row.private_price === null ? null : Number(row.private_price) }));
}

export async function listInsurance(clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("insurance_companies")
    .select("id, name, registration_code, average_payment_days, active, insurance_plans(id, name, active)")
    .eq("clinic_id", clinicId)
    .order("name");

  if (error) throw error;
  return (data ?? []) as unknown as {
    id: string;
    name: string;
    registration_code: string | null;
    average_payment_days: number | null;
    active: boolean;
    insurance_plans: { id: string; name: string; active: boolean }[];
  }[];
}

/**
 * clinic_members.user_id aponta para auth.users, não para profiles — não há FK
 * entre as duas, então o PostgREST não consegue fazer o join (PGRST200).
 * Os profiles vêm numa segunda consulta e são casados em memória.
 */
export async function listMembers(clinicId: string) {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("clinic_members")
    .select("id, user_id, role, status, created_at")
    .eq("clinic_id", clinicId)
    .order("created_at");

  if (error) throw error;
  if (!members?.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", members.map((member) => member.user_id));

  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return members.map((member) => ({
    id: member.id,
    role: member.role,
    status: member.status,
    created_at: member.created_at,
    profile: byId.get(member.user_id) ?? null,
  }));
}

/**
 * Tokens de integração da clínica. Usa o admin client (a tabela é gerida pelo
 * backend); quem chama já validou a sessão via requireSession.
 */
export async function listIntegrationTokens(clinicId: string, timezone: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("integration_tokens")
    .select("id, name, token_prefix, scopes, active, last_used_at, created_at")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((token) => ({
    id: token.id,
    name: token.name,
    token_prefix: token.token_prefix,
    scopes: token.scopes ?? [],
    active: token.active,
    last_used_at: token.last_used_at,
    created_label: dateLabel(token.created_at, timezone),
    last_used_label: token.last_used_at ? shortDateTimeLabel(token.last_used_at, timezone) : "Nunca usado",
  }));
}
