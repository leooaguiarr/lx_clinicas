import { createClient } from "@/lib/supabase/server";
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

export async function listProfessionals(clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select("id, full_name, specialty, council_type, council_number, email, phone, calendar_color, active")
    .eq("clinic_id", clinicId)
    .order("full_name");

  if (error) throw error;
  return data ?? [];
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
