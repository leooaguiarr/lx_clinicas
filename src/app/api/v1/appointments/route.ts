import { z } from "zod";
import { uuidSchema } from "@/lib/validation";
import {
  APPOINTMENT_SELECT,
  checkConflicts,
  getClinicSettings,
  resolveInstant,
  serializeAppointment,
} from "@/lib/api/appointments";
import { fail, failFromZod, logAudit, ok } from "@/lib/api/http";
import { authenticateRequest } from "@/lib/api/tokens";
import { normalizePhone } from "@/lib/domain";
import { logError, logWarn } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

const listSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  professional_id: uuidSchema.optional(),
  patient_id: uuidSchema.optional(),
  patient_phone: z.string().optional(),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/** GET /api/v1/appointments — lista com filtros. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request, "appointments:read");
  if (!auth.ok) return fail(auth.status, auth.code, auth.message);

  const url = new URL(request.url);
  const parsed = listSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return failFromZod(parsed.error);

  const input = parsed.data;
  const { clinicId } = auth.auth;
  const admin = createAdminClient();
  const { timezone } = await getClinicSettings(clinicId);

  let query = admin
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("clinic_id", clinicId)
    .order("start_at", { ascending: true })
    .limit(input.limit);

  if (input.date) {
    const start = resolveInstant({ date: input.date, time: "00:00" }, timezone);
    const end = resolveInstant({ date: input.date, time: "23:59" }, timezone);
    if (start instanceof Date && end instanceof Date) {
      query = query.gte("start_at", start.toISOString()).lte("start_at", end.toISOString());
    }
  }
  if (input.from) query = query.gte("start_at", new Date(input.from).toISOString());
  if (input.to) query = query.lte("start_at", new Date(input.to).toISOString());
  if (input.professional_id) query = query.eq("professional_id", input.professional_id);
  if (input.patient_id) query = query.eq("patient_id", input.patient_id);
  if (input.status) query = query.eq("status", input.status);

  if (input.patient_phone) {
    const { data: patient } = await admin
      .from("patients")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("normalized_phone", normalizePhone(input.patient_phone))
      .maybeSingle();
    if (!patient) return ok([]);
    query = query.eq("patient_id", patient.id);
  }

  const { data, error } = await query;
  if (error) {
    logError("api.appointments.GET", error, { clinicId, filters: input });
    return fail(500, "query_error", "Falha ao consultar agendamentos.");
  }
  return ok((data ?? []).map(serializeAppointment));
}

const createSchema = z.object({
  patient_id: uuidSchema.optional(),
  patient_phone: z.string().min(10).optional(),
  patient_name: z.string().min(3).optional(),
  professional_id: uuidSchema,
  procedure_id: uuidSchema.optional(),
  care_type: z.enum(["private", "insurance"]).default("private"),
  insurance_company_id: uuidSchema.optional(),
  start_at: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration_minutes: z.coerce.number().int().min(10).max(480).optional(),
  expected_value: z.coerce.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  source: z.enum(["reception", "whatsapp", "ai_agent", "booking_link", "professional", "import"]).default("ai_agent"),
  idempotency_key: z.string().max(120).optional(),
});

/**
 * POST /api/v1/appointments — cria agendamento.
 *
 * Paciente por patient_id ou patient_phone; se o telefone não existir e
 * patient_name vier junto, o paciente é criado (fluxo do agente no WhatsApp).
 * Idempotency-Key (header ou body) evita duplicar em retries do n8n.
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request, "appointments:write");
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
  const { timezone, defaultMinutes } = await getClinicSettings(clinicId);

  const idempotencyKey = request.headers.get("idempotency-key") ?? input.idempotency_key ?? null;
  if (idempotencyKey) {
    const { data: existing } = await admin
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("clinic_id", clinicId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing) return ok(serializeAppointment(existing));
  }

  // Resolver paciente
  let patientId = input.patient_id ?? null;
  if (!patientId && input.patient_phone) {
    const normalized = normalizePhone(input.patient_phone);
    const { data: found } = await admin
      .from("patients")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("normalized_phone", normalized)
      .maybeSingle();

    if (found) {
      patientId = found.id;
    } else if (input.patient_name) {
      const { data: created, error: createError } = await admin
        .from("patients")
        .insert({
          clinic_id: clinicId,
          full_name: input.patient_name,
          normalized_phone: normalized,
          phone_display: input.patient_phone,
          communication_consent: true,
          source: input.source,
        })
        .select("id")
        .single();
      if (createError || !created) {
        logError("api.appointments.POST", createError ?? "insert sem retorno", {
          clinicId,
          step: "patient_create",
          source: input.source,
        });
        return fail(500, "patient_create_failed", "Não foi possível cadastrar o paciente.");
      }
      patientId = created.id;
      await logAudit(clinicId, "patient.created", "patient", created.id, { via: "api", source: input.source });
    } else {
      return fail(404, "patient_not_found", "Telefone não cadastrado. Envie patient_name para criar o paciente.");
    }
  }
  if (!patientId) return fail(422, "validation_error", "Informe patient_id ou patient_phone.");

  const { data: patient } = await admin
    .from("patients")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("id", patientId)
    .maybeSingle();
  if (!patient) return fail(404, "patient_not_found", "Paciente não encontrado nesta clínica.");

  const { data: professional } = await admin
    .from("professionals")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("id", input.professional_id)
    .eq("active", true)
    .maybeSingle();
  if (!professional) return fail(404, "professional_not_found", "Profissional não encontrado nesta clínica.");

  // Resolver horário
  const start = resolveInstant({ iso: input.start_at, date: input.date, time: input.time }, timezone);
  if (!(start instanceof Date)) return fail(422, "validation_error", start.error);

  let duration = input.duration_minutes ?? null;
  if (!duration && input.procedure_id) {
    const { data: procedure } = await admin
      .from("procedures")
      .select("default_duration_minutes")
      .eq("clinic_id", clinicId)
      .eq("id", input.procedure_id)
      .maybeSingle();
    duration = procedure?.default_duration_minutes ?? null;
  }
  const end = new Date(start.getTime() + (duration ?? defaultMinutes) * 60000);

  const conflict = await checkConflicts(clinicId, input.professional_id, start, end);
  if (conflict.conflict) {
    // Esperado (o agente tenta um horário ocupado), mas o volume indica prompt ou
    // availability desalinhados — por isso fica registrado.
    logWarn("api.appointments.POST", "conflito de horário", {
      clinicId,
      professionalId: input.professional_id,
      startAt: start.toISOString(),
      reason: conflict.reason,
    });
    return fail(409, `conflict_${conflict.reason}`, conflict.detail);
  }

  const { data: created, error } = await admin
    .from("appointments")
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      professional_id: input.professional_id,
      procedure_id: input.procedure_id ?? null,
      insurance_company_id: input.care_type === "insurance" ? (input.insurance_company_id ?? null) : null,
      care_type: input.care_type,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      expected_value: input.expected_value ?? null,
      notes: input.notes ?? null,
      source: input.source,
      idempotency_key: idempotencyKey,
    })
    .select(APPOINTMENT_SELECT)
    .single();

  if (error || !created) {
    logError("api.appointments.POST", error ?? "insert sem retorno", {
      clinicId,
      patientId,
      professionalId: input.professional_id,
      startAt: start.toISOString(),
      source: input.source,
    });
    return fail(500, "create_failed", "Não foi possível criar o agendamento.");
  }

  const serialized = serializeAppointment(created);
  await logAudit(clinicId, "appointment.created", "appointment", (created as { id: string }).id, serialized);
  return ok(serialized, 201);
}
