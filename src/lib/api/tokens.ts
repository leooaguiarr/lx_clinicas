import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { logError } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tokens de integração por clínica (tabela integration_tokens).
 *
 * O valor completo (lxc_...) só existe no momento da geração — o banco guarda
 * apenas o SHA-256. O n8n envia o token em "Authorization: Bearer lxc_...".
 */

export const DEFAULT_SCOPES = [
  "availability:read",
  "appointments:read",
  "appointments:write",
  "patients:read",
  "patients:write",
] as const;

export type IntegrationAuth = {
  tokenId: string;
  clinicId: string;
  scopes: string[];
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): { token: string; prefix: string; hash: string } {
  const token = `lxc_${randomBytes(32).toString("base64url")}`;
  return { token, prefix: token.slice(0, 12), hash: hashToken(token) };
}

export type AuthResult = { ok: true; auth: IntegrationAuth } | { ok: false; status: number; code: string; message: string };

/** Valida o Bearer token e o escopo exigido. Não lança — devolve o erro pronto. */
export async function authenticateRequest(request: Request, requiredScope: string): Promise<AuthResult> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token || !token.startsWith("lxc_")) {
    return {
      ok: false,
      status: 401,
      code: "missing_token",
      message: "Envie o token no cabeçalho Authorization: Bearer lxc_...",
    };
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("integration_tokens")
    .select("id, clinic_id, scopes, active, expires_at, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !row || !row.active || row.revoked_at) {
    // Token errado é 401 normal; falha de consulta é problema nosso e precisa
    // aparecer — senão o banco fora do ar vira "credencial inválida" no n8n.
    if (error) logError("api.auth", error, { step: "token_lookup" });
    return { ok: false, status: 401, code: "invalid_token", message: "Token inválido ou revogado." };
  }

  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 401, code: "expired_token", message: "Token expirado." };
  }

  const scopes = row.scopes ?? [];
  if (!scopes.includes(requiredScope) && !scopes.includes("*")) {
    return {
      ok: false,
      status: 403,
      code: "insufficient_scope",
      message: `Este token não tem o escopo "${requiredScope}".`,
    };
  }

  // Telemetria de uso — falha aqui não pode derrubar a request.
  await admin
    .from("integration_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id)
    .then(() => undefined, () => undefined);

  return { ok: true, auth: { tokenId: row.id, clinicId: row.clinic_id, scopes } };
}
