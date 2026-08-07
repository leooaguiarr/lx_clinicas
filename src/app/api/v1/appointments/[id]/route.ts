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
import { logError, logWarn } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };

async function loadAppointment(clinicId: string, id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("clinic_id", clinicId)
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** GET /api/v1/appointments/:id */
export async function GET(request: Request, context: Context) {
  const auth = await authenticateRequest(request, "appointments:read");
  if (!auth.ok) return fail(auth.status, auth.code, auth.message);

  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) return fail(422, "validation_error", "id inválido.");

  const appointment = await loadAppointment(auth.auth.clinicId, id);
  if (!appointment) return fail(404, "not_found", "Agendamento não encontrado.");
  return ok(serializeAppointment(appointment));
}

const patchSchema = z.object({
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  start_at: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration_minutes: z.coerce.number().int().min(10).max(480).optional(),
  professional_id: uuidSchema.optional(),
  procedure_id: uuidSchema.nullable().optional(),
  expected_value: z.coerce.number().min(0).optional(),
  notes: z.string().max(2000).nullable().optional(),
  cancellation_reason: z.string().max(500).optional(),
});

/**
 * PATCH /api/v1/appointments/:id — confirmar, remarcar, concluir, cancelar.
 * Remarcação refaz a checagem de conflito ignorando o próprio agendamento.
 */
export async function PATCH(request: Request, context: Context) {
  const auth = await authenticateRequest(request, "appointments:write");
  if (!auth.ok) return fail(auth.status, auth.code, auth.message);

  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) return fail(422, "validation_error", "id inválido.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_json", "Corpo da requisição não é JSON válido.");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return failFromZod(parsed.error);

  const input = parsed.data;
  const { clinicId } = auth.auth;
  const admin = createAdminClient();

  const existing = await loadAppointment(clinicId, id);
  if (!existing) return fail(404, "not_found", "Agendamento não encontrado.");
  const current = existing as unknown as {
    id: string;
    professional_id: string;
    start_at: string;
    end_at: string;
    status: string;
  };

  const updates: Partial<import("@/types/database").AppointmentRow> = {};

  // Remarcação
  const wantsReschedule = input.start_at || (input.date && input.time) || input.duration_minutes || input.professional_id;
  if (wantsReschedule) {
    const { timezone } = await getClinicSettings(clinicId);
    const start = input.start_at || (input.date && input.time)
      ? resolveInstant({ iso: input.start_at, date: input.date, time: input.time }, timezone)
      : new Date(current.start_at);
    if (!(start instanceof Date)) return fail(422, "validation_error", start.error);

    const currentDuration = (new Date(current.end_at).getTime() - new Date(current.start_at).getTime()) / 60000;
    const end = new Date(start.getTime() + (input.duration_minutes ?? currentDuration) * 60000);
    const professionalId = input.professional_id ?? current.professional_id;

    const conflict = await checkConflicts(clinicId, professionalId, start, end, id);
    if (conflict.conflict) {
      logWarn("api.appointments.PATCH", "conflito ao remarcar", {
        clinicId,
        appointmentId: id,
        professionalId,
        startAt: start.toISOString(),
        reason: conflict.reason,
      });
      return fail(409, `conflict_${conflict.reason}`, conflict.detail);
    }

    updates.start_at = start.toISOString();
    updates.end_at = end.toISOString();
    updates.professional_id = professionalId;
  }

  if (input.status) {
    updates.status = input.status;
    if (input.status === "cancelled") {
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = input.cancellation_reason ?? null;
    }
  }
  if (input.procedure_id !== undefined) updates.procedure_id = input.procedure_id;
  if (input.expected_value !== undefined) updates.expected_value = input.expected_value;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.cancellation_reason && !input.status) updates.cancellation_reason = input.cancellation_reason;

  if (Object.keys(updates).length === 0) {
    return fail(422, "validation_error", "Nenhum campo para atualizar.");
  }

  const { data: updated, error } = await admin
    .from("appointments")
    .update(updates)
    .eq("clinic_id", clinicId)
    .eq("id", id)
    .select(APPOINTMENT_SELECT)
    .single();

  if (error || !updated) {
    logError("api.appointments.PATCH", error ?? "update sem retorno", {
      clinicId,
      appointmentId: id,
      fields: Object.keys(updates),
    });
    return fail(500, "update_failed", "Não foi possível atualizar o agendamento.");
  }

  const serialized = serializeAppointment(updated);
  await logAudit(clinicId, "appointment.updated", "appointment", id, serialized, {
    status: current.status,
    start_at: current.start_at,
    end_at: current.end_at,
  });
  return ok(serialized);
}

/**
 * DELETE /api/v1/appointments/:id — cancelamento (soft delete).
 * O histórico permanece; nada é apagado do banco.
 */
export async function DELETE(request: Request, context: Context) {
  const auth = await authenticateRequest(request, "appointments:write");
  if (!auth.ok) return fail(auth.status, auth.code, auth.message);

  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) return fail(422, "validation_error", "id inválido.");

  const { clinicId } = auth.auth;
  const admin = createAdminClient();

  const existing = await loadAppointment(clinicId, id);
  if (!existing) return fail(404, "not_found", "Agendamento não encontrado.");
  const current = existing as unknown as { status: string };

  if (current.status === "cancelled") return ok(serializeAppointment(existing));

  const reason = new URL(request.url).searchParams.get("reason");

  const { data: updated, error } = await admin
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq("clinic_id", clinicId)
    .eq("id", id)
    .select(APPOINTMENT_SELECT)
    .single();

  if (error || !updated) {
    logError("api.appointments.DELETE", error ?? "update sem retorno", { clinicId, appointmentId: id });
    return fail(500, "cancel_failed", "Não foi possível cancelar o agendamento.");
  }

  const serialized = serializeAppointment(updated);
  await logAudit(clinicId, "appointment.cancelled", "appointment", id, serialized, { status: current.status });
  return ok(serialized);
}
