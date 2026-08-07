"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uuidSchema } from "@/lib/validation";
import { requireSession } from "@/lib/auth/session";
import { DEFAULT_SCOPES, generateToken } from "@/lib/api/tokens";
import { logError } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * integration_tokens não tem FK navegável pela sessão e a escrita fica no
 * backend por design — por isso o admin client, sempre depois de conferir
 * que o usuário é admin da clínica.
 */

const createSchema = z.object({
  name: z.string().min(2, "Dê um nome ao token (ex.: n8n)").max(60),
});

export type TokenFormState = {
  error?: string;
  /** Presente uma única vez, logo após a criação. */
  token?: string;
  prefix?: string;
};

export async function createIntegrationToken(
  _previous: TokenFormState,
  formData: FormData,
): Promise<TokenFormState> {
  const session = await requireSession();
  if (session.role !== "admin") {
    return { error: "Apenas administradores podem gerar tokens de integração." };
  }

  const parsed = createSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { token, prefix, hash } = generateToken();
  const admin = createAdminClient();

  const { error } = await admin.from("integration_tokens").insert({
    clinic_id: session.clinicId,
    name: parsed.data.name,
    token_hash: hash,
    token_prefix: prefix,
    scopes: [...DEFAULT_SCOPES],
    created_by: session.userId,
    last_used_at: null,
    expires_at: null,
    revoked_at: null,
  });

  if (error) {
    logError("action.createIntegrationToken", error, { clinicId: session.clinicId, userId: session.userId });
    return { error: "Não foi possível criar o token. Tente novamente." };
  }

  revalidatePath("/configuracoes/integracoes");
  return { token, prefix };
}

export async function revokeIntegrationToken(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin") return;

  const id = formData.get("id");
  if (typeof id !== "string" || !uuidSchema.safeParse(id).success) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("integration_tokens")
    .update({ active: false, revoked_at: new Date().toISOString() })
    .eq("clinic_id", session.clinicId)
    .eq("id", id);

  // Revogação que falha calada deixa um token ativo que o admin acha que matou.
  if (error) logError("action.revokeIntegrationToken", error, { clinicId: session.clinicId, tokenId: id });

  revalidatePath("/configuracoes/integracoes");
}
