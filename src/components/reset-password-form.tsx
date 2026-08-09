"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword, type AuthFormState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary w-full" type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar nova senha"}
    </button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(updatePassword, {});

  return (
    <form className="space-y-4" action={formAction}>
      <label className="label">
        Nova senha
        <input
          className="input"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          autoFocus
        />
      </label>
      <label className="label">
        Repita a nova senha
        <input
          className="input"
          type="password"
          name="confirmation"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <p className="text-xs muted">Use ao menos 8 caracteres.</p>
      {state.error && (
        <p role="alert" className="rounded-lg bg-[#fdf0f1] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
