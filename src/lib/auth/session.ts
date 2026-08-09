import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClinicRole } from "@/types/database";

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string;
  initials: string;
  clinicId: string;
  clinicName: string;
  timezone: string;
  role: ClinicRole;
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts.at(0)?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Usuário logado + clínica ativa. `cache` evita repetir a consulta quando vários
 * Server Components da mesma renderização precisam do contexto.
 *
 * Retorna null quando não há sessão ou quando o usuário ainda não foi vinculado
 * a nenhuma clínica em clinic_members.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Ambas dependem só de user.id: em série custavam uma ida a mais ao banco em
  // toda navegação, já que o layout do dashboard chama isto a cada página.
  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase
      .from("clinic_members")
      .select("role, clinic_id, clinics(name, timezone)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (!membership?.clinics) return null;

  const fullName = profile?.full_name ?? user.email?.split("@")[0] ?? "Usuário";
  const clinic = membership.clinics as unknown as { name: string; timezone: string };

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName,
    initials: initialsOf(fullName),
    clinicId: membership.clinic_id,
    clinicName: clinic.name,
    timezone: clinic.timezone,
    role: membership.role,
  };
});

/** Igual a getSessionContext, mas redireciona quando não há acesso. */
export async function requireSession(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) redirect("/login?erro=sem-acesso");
  return context;
}
