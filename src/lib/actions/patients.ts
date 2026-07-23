"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  fullName: z.string().min(3, "Informe o nome completo"),
  phone: z.string().min(10, "Informe um telefone com DDD"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  insuranceCompanyId: z.string().uuid().optional().or(z.literal("")),
  mainProfessionalId: z.string().uuid().optional().or(z.literal("")),
  communicationConsent: z.coerce.boolean().optional(),
});

export type PatientFormState = { error?: string; success?: boolean };

export async function createPatient(
  _previous: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const session = await requireSession();

  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    cpf: formData.get("cpf") ?? "",
    birthDate: formData.get("birthDate") ?? "",
    insuranceCompanyId: formData.get("insuranceCompanyId") ?? "",
    mainProfessionalId: formData.get("mainProfessionalId") ?? "",
    communicationConsent: formData.get("communicationConsent") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const input = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("patients").insert({
    clinic_id: session.clinicId,
    full_name: input.fullName,
    normalized_phone: normalizePhone(input.phone),
    phone_display: input.phone,
    email: input.email || null,
    cpf: input.cpf || null,
    birth_date: input.birthDate || null,
    insurance_company_id: input.insuranceCompanyId || null,
    insurance_plan_id: null,
    insurance_card_number: null,
    insurance_card_expiration: null,
    main_professional_id: input.mainProfessionalId || null,
    communication_consent: input.communicationConsent ?? false,
    gender: null,
    notes: null,
    source: "reception",
  });

  if (error) {
    // 23505 = unique (clinic_id, normalized_phone)
    if (error.code === "23505") {
      return { error: "Já existe um paciente com esse telefone nesta clínica." };
    }
    return { error: "Não foi possível cadastrar o paciente. Tente novamente." };
  }

  revalidatePath("/pacientes");
  return { success: true };
}
