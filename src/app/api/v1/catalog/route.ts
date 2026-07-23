import { fail, ok } from "@/lib/api/http";
import { authenticateRequest } from "@/lib/api/tokens";
import { getClinicSettings } from "@/lib/api/appointments";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/v1/catalog — profissionais, procedimentos e convênios ativos.
 * O agente usa isso para mapear "limpeza com a Dra. Marina" em IDs.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request, "availability:read");
  if (!auth.ok) return fail(auth.status, auth.code, auth.message);

  const { clinicId } = auth.auth;
  const admin = createAdminClient();

  const [{ timezone }, professionals, procedures, insuranceCompanies] = await Promise.all([
    getClinicSettings(clinicId),
    admin
      .from("professionals")
      .select("id, full_name, specialty")
      .eq("clinic_id", clinicId)
      .eq("active", true)
      .order("full_name"),
    admin
      .from("procedures")
      .select("id, name, category, default_duration_minutes, private_price")
      .eq("clinic_id", clinicId)
      .eq("active", true)
      .order("name"),
    admin
      .from("insurance_companies")
      .select("id, name")
      .eq("clinic_id", clinicId)
      .eq("active", true)
      .order("name"),
  ]);

  if (professionals.error || procedures.error || insuranceCompanies.error) {
    return fail(500, "query_error", "Falha ao consultar o catálogo.");
  }

  return ok({
    timezone,
    professionals: professionals.data ?? [],
    procedures: (procedures.data ?? []).map((row) => ({
      ...row,
      private_price: row.private_price === null ? null : Number(row.private_price),
    })),
    insurance_companies: insuranceCompanies.data ?? [],
  });
}
