"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { zonedDateTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const schema = z
  .object({
    patientId: z.string().uuid("Selecione o paciente"),
    professionalId: z.string().uuid("Selecione o profissional"),
    procedureId: z.string().uuid("Selecione o procedimento").optional().or(z.literal("")),
    careType: z.enum(["private", "insurance"]),
    insuranceCompanyId: z.string().uuid().optional().or(z.literal("")),
    date: z.string().min(1, "Informe a data"),
    start: z.string().min(1, "Informe o horário inicial"),
    end: z.string().min(1, "Informe o horário final"),
    expectedValue: z.coerce.number().min(0, "Valor inválido"),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => data.end > data.start, {
    message: "O horário final precisa ser maior que o inicial",
    path: ["end"],
  })
  .refine((data) => data.careType !== "insurance" || Boolean(data.insuranceCompanyId), {
    message: "Selecione o convênio",
    path: ["insuranceCompanyId"],
  });

export type AppointmentFormState = { error?: string; success?: boolean };

export async function createAppointment(
  _previous: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const session = await requireSession();

  const parsed = schema.safeParse({
    patientId: formData.get("patientId"),
    professionalId: formData.get("professionalId"),
    procedureId: formData.get("procedureId") ?? "",
    careType: formData.get("careType"),
    insuranceCompanyId: formData.get("insuranceCompanyId") ?? "",
    date: formData.get("date"),
    start: formData.get("start"),
    end: formData.get("end"),
    expectedValue: formData.get("expectedValue") ?? 0,
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const input = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("appointments").insert({
    clinic_id: session.clinicId,
    patient_id: input.patientId,
    professional_id: input.professionalId,
    procedure_id: input.procedureId || null,
    insurance_company_id: input.careType === "insurance" ? input.insuranceCompanyId || null : null,
    care_type: input.careType,
    start_at: zonedDateTime(input.date, input.start, session.timezone).toISOString(),
    end_at: zonedDateTime(input.date, input.end, session.timezone).toISOString(),
    expected_value: input.expectedValue,
    notes: input.notes || null,
    source: "reception",
    created_by: session.userId,
    updated_by: session.userId,
  });

  if (error) {
    // 23P01 = violação da constraint de exclusão appointments_no_overlap.
    if (error.code === "23P01") {
      return { error: "Esse profissional já tem atendimento nesse horário." };
    }
    return { error: "Não foi possível criar o agendamento. Tente novamente." };
  }

  revalidatePath("/agenda");
  revalidatePath("/pacientes");
  return { success: true };
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const session = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ status: status as never, updated_by: session.userId })
    .eq("id", appointmentId)
    .eq("clinic_id", session.clinicId);

  if (error) throw error;
  revalidatePath("/agenda");
}
