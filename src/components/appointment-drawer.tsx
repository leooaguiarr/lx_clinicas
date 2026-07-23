"use client";

import { X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createAppointment, type AppointmentFormState } from "@/lib/actions/appointments";

export type SchedulingCatalogs = {
  patients: { id: string; full_name: string; phone_display: string | null }[];
  professionals: { id: string; full_name: string }[];
  procedures: { id: string; name: string; default_duration_minutes: number; private_price: number | null }[];
  insuranceCompanies: { id: string; name: string }[];
};

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Criar agendamento"}
    </button>
  );
}

export function AppointmentDrawer({
  open,
  onClose,
  catalogs,
  initialDate,
  initialTime = "09:00",
}: {
  open: boolean;
  onClose: () => void;
  catalogs: SchedulingCatalogs;
  initialDate: string;
  initialTime?: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<AppointmentFormState, FormData>(createAppointment, {});
  const [careType, setCareType] = useState<"private" | "insurance">("private");
  const [procedureId, setProcedureId] = useState("");
  const [start, setStart] = useState(initialTime);
  const [end, setEnd] = useState(addMinutes(initialTime, 30));
  const [value, setValue] = useState("0");

  useEffect(() => {
    setStart(initialTime);
    setEnd(addMinutes(initialTime, 30));
  }, [initialTime]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  if (!open) return null;

  // Selecionar o procedimento preenche duração e valor de tabela.
  function handleProcedure(id: string) {
    setProcedureId(id);
    const procedure = catalogs.procedures.find((item) => item.id === id);
    if (!procedure) return;
    setEnd(addMinutes(start, procedure.default_duration_minutes));
    if (careType === "private" && procedure.private_price !== null) setValue(String(procedure.private_price));
  }

  return (
    <>
      <button className="fixed inset-0 z-40 bg-[#172b3a]/25" onClick={onClose} aria-label="Fechar drawer" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[470px] overflow-y-auto bg-white shadow-[-8px_0_24px_rgba(23,43,58,.08)]"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-5">
          <div>
            <h2 id="drawer-title" className="text-lg font-bold">Novo agendamento</h2>
            <p className="text-xs muted">Preencha os dados do atendimento</p>
          </div>
          <button className="button !p-2" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>

        <form className="space-y-4 p-6" action={formAction}>
          <label className="label">
            Paciente
            <select className="select" name="patientId" required defaultValue="">
              <option value="" disabled>Selecione o paciente</option>
              {catalogs.patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}{patient.phone_display ? ` — ${patient.phone_display}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="label">
              Profissional
              <select className="select" name="professionalId" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {catalogs.professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>{professional.full_name}</option>
                ))}
              </select>
            </label>
            <label className="label">
              Procedimento
              <select className="select" name="procedureId" value={procedureId} onChange={(event) => handleProcedure(event.target.value)}>
                <option value="">Selecione</option>
                {catalogs.procedures.map((procedure) => (
                  <option key={procedure.id} value={procedure.id}>{procedure.name}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold">Tipo de atendimento</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`button ${careType === "private" ? "!border-[var(--primary)] !bg-[#eef7f9] text-[var(--primary)]" : ""}`}>
                <input type="radio" name="careType" value="private" className="sr-only" checked={careType === "private"} onChange={() => setCareType("private")} />
                Particular
              </label>
              <label className={`button ${careType === "insurance" ? "!border-[var(--insurance)] !bg-[#f2f0fa] text-[var(--insurance)]" : ""}`}>
                <input type="radio" name="careType" value="insurance" className="sr-only" checked={careType === "insurance"} onChange={() => setCareType("insurance")} />
                Convênio
              </label>
            </div>
          </fieldset>

          {careType === "insurance" && (
            <label className="label">
              Convênio
              <select className="select" name="insuranceCompanyId" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {catalogs.insuranceCompanies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-3 gap-3">
            <label className="label">
              Data
              <input type="date" className="input" name="date" defaultValue={initialDate} required />
            </label>
            <label className="label">
              Início
              <input type="time" className="input" name="start" value={start} onChange={(event) => setStart(event.target.value)} required />
            </label>
            <label className="label">
              Final
              <input type="time" className="input" name="end" value={end} onChange={(event) => setEnd(event.target.value)} required />
            </label>
          </div>

          <label className="label">
            Valor previsto
            <input type="number" step="0.01" min="0" className="input" name="expectedValue" value={value} onChange={(event) => setValue(event.target.value)} />
          </label>

          <label className="label">
            Observação
            <textarea className="input !h-24 py-2" name="notes" placeholder="Informações para a recepção" />
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
