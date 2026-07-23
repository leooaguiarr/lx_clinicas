"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateClinic, type SettingsFormState } from "@/lib/actions/settings";

type Clinic = {
  name: string;
  legal_name: string | null;
  document: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" type="submit" disabled={pending || disabled}>
      {pending ? "Salvando…" : "Salvar alterações"}
    </button>
  );
}

export function ClinicForm({ clinic, canEdit }: { clinic: Clinic; canEdit: boolean }) {
  const [state, formAction] = useActionState<SettingsFormState, FormData>(updateClinic, {});

  return (
    <form action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label">
          Nome fantasia
          <input className="input" name="name" defaultValue={clinic.name} disabled={!canEdit} required />
        </label>
        <label className="label">
          Razão social
          <input className="input" name="legalName" defaultValue={clinic.legal_name ?? ""} disabled={!canEdit} />
        </label>
        <label className="label">
          CNPJ
          <input className="input" name="document" defaultValue={clinic.document ?? ""} disabled={!canEdit} />
        </label>
        <label className="label">
          Telefone
          <input className="input" name="phone" defaultValue={clinic.phone ?? ""} disabled={!canEdit} />
        </label>
        <label className="label">
          E-mail
          <input type="email" className="input" name="email" defaultValue={clinic.email ?? ""} disabled={!canEdit} />
        </label>
        <label className="label">
          Fuso horário
          <input className="input" name="timezone" defaultValue={clinic.timezone} disabled={!canEdit} />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 rounded-lg bg-[#fdf0f1] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-4 rounded-lg bg-[#eaf6f2] px-3 py-2 text-xs font-medium text-[var(--success)]">
          Dados atualizados.
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <SubmitButton disabled={!canEdit} />
      </div>
    </form>
  );
}
