"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset, type ResetRequestState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary w-full" type="submit" disabled={pending}>
      {pending ? "Enviando…" : "Enviar link de redefinição"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ResetRequestState, FormData>(requestPasswordReset, {});

  if (state.sent) {
    return (
      <div className="space-y-4 text-sm">
        <p className="rounded-lg bg-[#e8f6f1] px-3 py-2 text-xs font-medium text-[#237661]">
          Se houver uma conta com esse e-mail, o link de redefinição chegará em instantes.
        </p>
        <p className="muted">
          O link vale por tempo limitado e só pode ser usado uma vez. Confira também a caixa de spam.
        </p>
        <Link className="button w-full" href="/login">
          Voltar para o acesso
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" action={formAction}>
      <label className="label">
        E-mail da clínica
        <input className="input" type="email" name="email" autoComplete="email" required autoFocus />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-[#fdf0f1] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <Link className="block text-center text-xs font-semibold text-[var(--primary)]" href="/login">
        Voltar para o acesso
      </Link>
    </form>
  );
}
