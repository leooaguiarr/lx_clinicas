"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { brl } from "@/lib/utils";
import { PatientDrawer } from "./patient-drawer";
import { StatusBadge } from "./status-badge";
import type { PatientListResult } from "@/lib/queries/patients";

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 350;

export function PatientTable({
  result,
  page,
  professionals,
  insuranceCompanies,
}: {
  result: PatientListResult;
  page: number;
  professionals: { id: string; full_name: string }[];
  insuranceCompanies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const [term, setTerm] = useState(searchParams.get("busca") ?? "");

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => router.replace(`/pacientes?${params.toString()}`, { scroll: false }));
  }

  // Busca só dispara depois que o usuário para de digitar.
  useEffect(() => {
    const current = searchParams.get("busca") ?? "";
    if (term === current) return;
    const timer = setTimeout(() => pushParams({ busca: term, pagina: "" }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const careType = searchParams.get("tipo") ?? "";
  const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <>
      <section className={`panel ${isPending ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap gap-3 border-b border-[var(--border)] p-4">
          <label className="relative min-w-[260px] flex-1">
            <span className="sr-only">Buscar paciente</span>
            <Search className="absolute left-3 top-3 text-[var(--text-secondary)]" size={16} />
            <input
              className="input !pl-9"
              placeholder="Buscar por nome ou telefone"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
          </label>
          <select className="select !w-auto" value={careType} onChange={(event) => pushParams({ tipo: event.target.value, pagina: "" })}>
            <option value="">Todos os tipos</option>
            <option value="private">Particular</option>
            <option value="insurance">Convênio</option>
          </select>
          <button className="button" onClick={() => setDrawer(true)}>
            <Plus size={16} />
            Novo paciente
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Última consulta</th>
                <th>Próxima consulta</th>
                <th>Profissional</th>
                <th>Tipo</th>
                <th>Convênio</th>
                <th>Saldo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <Link className="font-semibold text-[var(--primary)] hover:underline" href={`/pacientes/${patient.id}`}>
                      {patient.name}
                    </Link>
                    <span className="block text-xs muted">{patient.phone}</span>
                  </td>
                  <td>{patient.last}</td>
                  <td>{patient.next}</td>
                  <td>{patient.professional}</td>
                  <td>{patient.type}</td>
                  <td>{patient.insurance}</td>
                  <td className={patient.balance ? "font-semibold text-[var(--danger)]" : ""}>{brl(patient.balance)}</td>
                  <td><StatusBadge status={patient.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.items.length === 0 && <div className="p-10 text-center text-sm muted">Nenhum paciente encontrado.</div>}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] p-4 text-xs muted">
          <span>Mostrando {result.items.length} de {result.total} pacientes</span>
          <div className="flex gap-1">
            <button className="button !px-3 !py-1.5" disabled={page <= 1} onClick={() => pushParams({ pagina: String(page - 1) })}>
              Anterior
            </button>
            <button className="button !px-3 !py-1.5" disabled={page >= lastPage} onClick={() => pushParams({ pagina: String(page + 1) })}>
              Próxima
            </button>
          </div>
        </div>
      </section>

      <PatientDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        professionals={professionals}
        insuranceCompanies={insuranceCompanies}
      />
    </>
  );
}
