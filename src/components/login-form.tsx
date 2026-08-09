"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type AuthFormState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary w-full" type="submit" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signIn, {});

  return (
    <form className="space-y-4" action={formAction}>
      {next && <input type="hidden" name="next" value={next} />}
      <label className="label">
        E-mail
        <input className="input" type="email" name="email" autoComplete="email" required />
      </label>
      <label className="label">
        Senha
        <input className="input" type="password" name="password" autoComplete="current-password" required />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-[#fdf0f1] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <Link className="text-xs font-semibold text-[var(--primary)]" href="/esqueci-minha-senha">
          Esqueci minha senha
        </Link>
      </div>
      <SubmitButton />
    </form>
  );
}
