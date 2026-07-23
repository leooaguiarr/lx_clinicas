"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
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
    return { error: "Não foi possível salvar as alterações." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
