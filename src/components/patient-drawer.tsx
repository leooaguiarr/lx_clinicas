"use client";

import { X } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createPatient, type PatientFormState } from "@/lib/actions/patients";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Cadastrar paciente"}
    </button>
  );
}

export function PatientDrawer({
  open,
  onClose,
  professionals,
  insuranceCompanies,
}: {
  open: boolean;
  onClose: () => void;
  professionals: { id: string; full_name: string }[];
  insuranceCompanies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<PatientFormState, FormData>(createPatient, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  if (!open) return null;

  return (
    <>
      <button className="fixed inset-0 z-40 bg-[#172b3a]/25" onClick={onClose} aria-label="Fechar drawer" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-drawer-title"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[470px] overflow-y-auto bg-white shadow-[-8px_0_24px_rgba(23,43,58,.08)]"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-5">
          <div>
            <h2 id="patient-drawer-title" className="text-lg font-bold">Novo paciente</h2>
            <p className="text-xs muted">Cadastro básico da recepção</p>
          </div>
          <button className="button !p-2" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>

        <form className="space-y-4 p-6" action={formAction}>
          <label className="label">
            Nome completo
            <input className="input" name="fullName" required minLength={3} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="label">
              Telefone
              <input className="input" name="phone" placeholder="(35) 99999-0000" required />
            </label>
            <label className="label">
              Nascimento
              <input type="date" className="input" name="birthDate" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="label">
              CPF
              <input className="input" name="cpf" placeholder="000.000.000-00" />
            </label>
            <label className="label">
              E-mail
              <input type="email" className="input" name="email" />
            </label>
          </div>

          <label className="label">
            Convênio
            <select className="select" name="insuranceCompanyId" defaultValue="">
              <option value="">Particular</option>
              {insuranceCompanies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>

          <label className="label">
            Profissional principal
            <select className="select" name="mainProfessionalId" defaultValue="">
              <option value="">Sem preferência</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>{professional.full_name}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="communicationConsent" />
            Autoriza contato por WhatsApp
          </label>

          {state.error && (
            <p role="alert" className="rounded-lg bg-[#fdf0f1] px-3 py-2 text-xs font-medium text-[var(--danger)]">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-5">
            <button type="button" className="button" onClick={onClose}>Cancelar</button>
            <SubmitButton />
          </div>
        </form>
      </aside>
    </>
  );
}
