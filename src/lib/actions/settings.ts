"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const clinicSchema = z.object({
  name: z.string().min(2, "Informe o nome fantasia"),
  legalName: z.string().optional(),
  document: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  timezone: z.string().min(1),
});

export type SettingsFormState = { error?: string; success?: boolean };

export async function updateClinic(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requireSession();
  if (session.role !== "admin") {
    return { error: "Apenas administradores podem alterar os dados da clínica." };
  }

  const parsed = clinicSchema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName") ?? "",
    document: formData.get("document") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    timezone: formData.get("timezone") ?? "America/Sao_Paulo",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clinics")
    .update({
      name: parsed.data.name,
      legal_name: parsed.data.legalName || null,
      document: parsed.data.document || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      timezone: parsed.data.timezone,
    })
    .eq("id", session.clinicId);

  if (error) {
    logError("action.updateClinic", error, { clinicId: session.clinicId, userId: session.userId });
    return { error: "Não foi possível salvar as alterações." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

const professionalSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(3, "O nome precisa ter ao menos 3 caracteres"),
  specialty: z.string().optional(),
  councilType: z.string().optional(),
  councilNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  calendarColor: z.string().default("#0D9488"),
  active: z.boolean().default(true),
});

export type ProfessionalFormState = { error?: string; success?: boolean };

export async function saveProfessional(
  _previous: ProfessionalFormState,
  formData: FormData,
): Promise<ProfessionalFormState> {
  const session = await requireSession();
  if (session.role !== "admin") {
    return { error: "Apenas administradores podem gerenciar profissionais." };
  }

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId.trim().length > 0 ? rawId.trim() : undefined;

  const parsed = professionalSchema.safeParse({
    id,
    fullName: formData.get("fullName"),
    specialty: formData.get("specialty") ?? "",
    councilType: formData.get("councilType") ?? "",
    councilNumber: formData.get("councilNumber") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    calendarColor: formData.get("calendarColor") ?? "#0D9488",
    active: formData.get("active") === "true" || formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const input = parsed.data;
  const procedureIds = formData.getAll("procedureIds").map(String).filter(Boolean);

  // Extrai os 7 dias de expediente (0 = Domingo a 6 = Sábado)
  const schedules: {
    weekday: number;
    active: boolean;
    startTime: string;
    endTime: string;
    interval: number;
  }[] = [];

  for (let w = 0; w <= 6; w++) {
    const isActive = formData.get(`schedule_${w}_active`) === "on" || formData.get(`schedule_${w}_active`) === "true";
    const startTime = (formData.get(`schedule_${w}_start`) as string) || "08:00";
    const endTime = (formData.get(`schedule_${w}_end`) as string) || "18:00";
    const interval = Number(formData.get(`schedule_${w}_interval`)) || 30;

    schedules.push({
      weekday: w,
      active: isActive,
      startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      interval,
    });
  }

  const supabase = await createClient();

  let targetId = input.id;

  if (targetId) {
    const { error: updateError } = await supabase
      .from("professionals")
      .update({
        full_name: input.fullName,
        specialty: input.specialty || null,
        council_type: input.councilType || null,
        council_number: input.councilNumber || null,
        phone: input.phone || null,
        email: input.email || null,
        calendar_color: input.calendarColor,
        active: input.active,
      })
      .eq("id", targetId)
      .eq("clinic_id", session.clinicId);

    if (updateError) {
      logError("action.saveProfessional.update", updateError, { clinicId: session.clinicId, targetId });
      return { error: "Falha ao atualizar dados do profissional." };
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("professionals")
      .insert({
        clinic_id: session.clinicId,
        full_name: input.fullName,
        specialty: input.specialty || null,
        council_type: input.councilType || null,
        council_number: input.councilNumber || null,
        phone: input.phone || null,
        email: input.email || null,
        calendar_color: input.calendarColor,
        active: input.active,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      logError("action.saveProfessional.insert", insertError, { clinicId: session.clinicId });
      return { error: "Falha ao cadastrar profissional." };
    }
    targetId = inserted.id;
  }

  // Atualiza os horários de expediente (professional_schedules)
  await supabase
    .from("professional_schedules")
    .delete()
    .eq("clinic_id", session.clinicId)
    .eq("professional_id", targetId);

  const schedulesToInsert = schedules.map((s) => ({
    clinic_id: session.clinicId,
    professional_id: targetId!,
    weekday: s.weekday,
    start_time: s.startTime,
    end_time: s.endTime,
    appointment_interval_minutes: s.interval,
    active: s.active,
  }));

  if (schedulesToInsert.length > 0) {
    const { error: scheduleError } = await supabase
      .from("professional_schedules")
      .insert(schedulesToInsert);

    if (scheduleError) {
      logError("action.saveProfessional.schedules", scheduleError, { clinicId: session.clinicId, targetId });
    }
  }

  // Atualiza os procedimentos que o profissional atende (professional_procedures)
  await supabase
    .from("professional_procedures")
    .delete()
    .eq("clinic_id", session.clinicId)
    .eq("professional_id", targetId);

  if (procedureIds.length > 0) {
    const proceduresToInsert = procedureIds.map((procId) => ({
      clinic_id: session.clinicId,
      professional_id: targetId!,
      procedure_id: procId,
    }));

    const { error: procError } = await supabase
      .from("professional_procedures")
      .insert(proceduresToInsert);

    if (procError) {
      logError("action.saveProfessional.procedures", procError, { clinicId: session.clinicId, targetId });
    }
  }

  revalidatePath("/configuracoes/profissionais");
  revalidatePath("/agenda");
  return { success: true };
}

export async function toggleProfessionalActive(
  professionalId: string,
  active: boolean,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();
  if (session.role !== "admin") {
    return { success: false, error: "Apenas administradores podem alterar o status do profissional." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update({ active })
    .eq("id", professionalId)
    .eq("clinic_id", session.clinicId);

  if (error) {
    logError("action.toggleProfessionalActive", error, { clinicId: session.clinicId, professionalId });
    return { success: false, error: "Não foi possível alterar o status." };
  }

  revalidatePath("/configuracoes/profissionais");
  revalidatePath("/agenda");
  return { success: true };
}

