"use client";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { patients, type CareType } from "@/lib/mock-data";
import { brl } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

const PAGE_SIZE = 8;

export function PatientTable() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"Todos os tipos" | CareType>(
    "Todos os tipos",
  );
  const [page, setPage] = useState(1);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return patients.filter(
      (p) =>
        (type === "Todos os tipos" || p.type === type) &&
        (query === "" ||
          p.name.toLowerCase().includes(query) ||
          p.phone.replace(/\D/g, "").includes(query.replace(/\D/g, "")) ||
          p.cpf.replace(/\D/g, "").includes(query.replace(/\D/g, ""))),
    );
  }, [q, type]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = list.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart = list.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, list.length);

  return (
    <section className="panel">
      <div className="flex flex-wrap gap-3 border-b border-[var(--border)] p-4">
        <label className="relative min-w-[260px] flex-1">
          <Search
            className="absolute left-3 top-3 text-[var(--text-secondary)]"
            size={16}
          />
          <input
            className="input !pl-9"
            placeholder="Buscar por nome, telefone ou CPF"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          className="select !w-auto"
          value={type}
          onChange={(e) => {
            setType(e.target.value as typeof type);
            setPage(1);
          }}
        >
          <option>Todos os tipos</option>
          <option>Particular</option>
          <option>Convênio</option>
        </select>
        <button className="button">
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
            {paginated.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    className="font-semibold text-[var(--primary)] hover:underline"
                    href={`/pacientes/${p.id}`}
                  >
                    {p.name}
                  </Link>
                  <span className="block text-xs muted">{p.phone}</span>
                </td>
                <td>{p.last}</td>
                <td>{p.next}</td>
                <td>{p.professional}</td>
                <td>{p.type}</td>
                <td>{p.insurance}</td>
                <td
                  className={
                    p.balance ? "font-semibold text-[var(--danger)]" : ""
                  }
                >
                  {brl(p.balance)}
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="p-10 text-center text-sm muted">
            Nenhum paciente encontrado.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border)] p-4 text-xs muted">
        <span>
          Mostrando {rangeStart}–{rangeEnd} de {list.length} pacientes
        </span>
        <div className="flex items-center gap-2">
          <button
            className="button !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            className="button !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </div>
      </div>
    </section>
  );
}
