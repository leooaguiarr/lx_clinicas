"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";

const credentialsSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
  next: z.string().optional(),
});

export type AuthFormState = { error?: string };

/**
 * Origem pública desta instalação, para montar o link enviado por e-mail.
 * Vem dos cabeçalhos porque o mesmo código roda em localhost, preview e produção.
 */
async function siteOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function signIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export type ResetRequestState = { error?: string; sent?: boolean };

/**
 * Dispara o e-mail de redefinição.
 *
 * Responde sempre "enviado", mesmo quando o e-mail não existe: dizer o
 * contrário transformaria a tela num verificador de quem é cliente. A falha
 * real (SMTP fora do ar, por exemplo) vai para o log do servidor.
 */
export async function requestPasswordReset(
  _previous: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = z
    .string()
    .email("Informe um e-mail válido")
    .safeParse(formData.get("email"));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/confirmar?next=/redefinir-senha`,
  });

  if (error) logError("action.requestPasswordReset", error, { origin });

  return { sent: true };
}

const newPasswordSchema = z
  .object({
    password: z.string().min(8, "A nova senha precisa ter ao menos 8 caracteres"),
    confirmation: z.string(),
  })
  .refine((data) => data.password === data.confirmation, {
    message: "As senhas não coincidem",
    path: ["confirmation"],
  });

/**
 * Grava a nova senha. Depende da sessão criada por /auth/confirmar a partir do
 * link do e-mail — sem ela o Supabase recusa, e o motivo é o link vencido.
 */
export async function updatePassword(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Seu link expirou. Peça um novo e-mail de redefinição." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    logError("action.updatePassword", error, { userId: user.id });
    return { error: "Não foi possível alterar a senha. Tente novamente." };
  }

  revalidatePath("/", "layout");
  redirect("/agenda");
}
