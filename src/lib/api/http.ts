import "server-only";

import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function failFromZod(error: ZodError) {
  const issue = error.issues[0];
  const path = issue.path.join(".");
  return fail(422, "validation_error", path ? `${path}: ${issue.message}` : issue.message);
}

/** Registro em audit_logs. Erros são engolidos — auditoria não derruba a operação. */
export async function logAudit(
  clinicId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  newData: unknown = null,
  oldData: unknown = null,
) {
  const admin = createAdminClient();
  await admin
    .from("audit_logs")
    .insert({
      clinic_id: clinicId,
      user_id: null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      new_data: newData,
      old_data: oldData,
      ip_address: null,
    })
    .then(() => undefined, () => undefined);
}
