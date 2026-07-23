import { z } from "zod";
import { uuidSchema } from "@/lib/validation";
import { fail, failFromZod, logAudit, ok } from "@/lib/api/http";
import { authenticateRequest } from "@/lib/api/tokens";
import { formatPhone, normalizePhone } from "@/lib/domain";
import { createAdminClient } from "@/lib/supabase/admin";

const PATIENT_SELECT =
  "id, full_name, normalized_phone, phone_display, email, birth_date, cpf, active, insurance_company_id, main_professional_id, created_at, insurance_companies(name)";

type PatientJoin = {
  id: string;
  full_name: string;
  normalized_phone: string;
  phone_display: string | null;
  email: string | null;
  birth_date: string | null;
  cpf: string | null;
  active: boolean;
  insurance_company_id: string | null;
  main_professional_id: string | null;
  created_at: string;
  insurance_companies: { name: string } | null;
};

function serializePatient(row: unknown) {
  const item = row as PatientJoin;
  const { insurance_companies, ...rest } = item;
  return {
    ...rest,
    phone: item.phone_display ?? formatPhone(item.normalized_phone),
    insurance_name: insurance_companies?.name ?? null,
  };
}

const listSchema = z.object({
  phone: z.string().min(8).optional(),
  q: z.string().min(2).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/v1/patients?phone=5535999128432  (busca exata pelo telefone)
 * GET /api/v1/patients?q=beatriz            (busca por nome)
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request, "patients:read");
  if (!auth.ok) return fail(auth.status, auth.code, auth.message);

  const url = new URL(request.url);
  const parsed = listSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return failFromZod(parsed.error);

  const input = parsed.data;
  if (!input.phone && !input.q) {
    return fail(422, "validation_error", "Informe phone ou q.");
  }

  const admin = createAdminClient();
  let query = admin
    .from("patients")
    .select(PATIENT_SELECT)
    .eq("clinic_id", auth.auth.clinicId)
    .limit(input.limit);

  if (input.phone) query = query.eq("normalized_phone", normalizePhone(input.phone));
  else if (input.q) query = query.ilike("full_name", `%${input.q}%`).order("full_name");

  const { data, error } = await query;
  if (error) return fail(500, "query_error", "Falha ao consultar pacientes.");
  return ok((data ?? []).map(serializePatient));
}

const createSchema = z.object({
  full_name: z.string().min(3),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cpf: z.string().optional(),
  insurance_company_id: uuidSchema.optional(),
  main_professional_id: uuidSchema.optional(),
  notes: z.string().max(2000).optional(),
  source: z.enum(["reception", "whatsapp", "ai_agent", "booking_link", "professional", "import"]).default("ai_agent"),
});

/**
 * POST /api/v1/patients — cria paciente.
 * Se o telefone já existir na clínica, devolve o cadastro existente
 * (created: false) em vez de erro — comportamento amigável para o agente.
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request, "patients:write");
  if (!auth.ok) return fail(auth.status, auth.code, auth.message);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_json", "Corpo da requisição não é JSON válido.");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return failFromZod(parsed.error);

  const input = parsed.data;
  const { clinicId } = auth.auth;
  const admin = createAdminClient();
  const normalized = normalizePhone(input.phone);

  const { data: created, error } = await admin
    .from("patients")
    .insert({
      clinic_id: clinicId,
      full_name: input.full_name,
      normalized_phone: normalized,
      phone_display: input.phone,
      email: input.email ?? null,
      birth_date: input.birth_date ?? null,
      cpf: input.cpf ?? null,
      insurance_company_id: input.insurance_company_id ?? null,
      main_professional_id: input.main_professional_id ?? null,
      notes: input.notes ?? null,
      communication_consent: true,
      source: input.source,
    })
    .select(PATIENT_SELECT)
    .single();

  if (error) {
    // unique (clinic_id, normalized_phone) — devolve o cadastro existente.
    if (error.code === "23505") {
      const { data: existing } = await admin
        .from("patients")
        .select(PATIENT_SELECT)
        .eq("clinic_id", clinicId)
        .eq("normalized_phone", normalized)
        .maybeSingle();
      if (existing) return ok({ created: false, patient: serializePatient(existing) });
    }
    return fail(500, "create_failed", "Não foi possível cadastrar o paciente.");
  }

  await logAudit(clinicId, "patient.created", "patient", (created as { id: string }).id, { via: "api" });
  return ok({ created: true, patient: serializePatient(created) }, 201);
}
