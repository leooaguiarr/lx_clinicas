"use client";
import { useState } from "react";
import {
  CalendarPlus,
  FileText,
  MessageCircle,
  Mail,
  Phone,
} from "lucide-react";
import {
  patientAppointments,
  patientHistory,
  transactions,
  type Patient,
} from "@/lib/mock-data";
import { brl } from "@/lib/utils";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

const tabs = [
  "Resumo",
  "Agendamentos",
  "Financeiro",
  "Documentos",
  "Histórico",
] as const;
type Tab = (typeof tabs)[number];

export function PatientProfile({ patient }: { patient: Patient }) {
  const [tab, setTab] = useState<Tab>("Resumo");
  const events = patientAppointments.filter((a) => a.patientId === patient.id);
  const finance = transactions.filter((t) =>
    t.description.includes(patient.name),
  );
  const history = patientHistory.filter((h) => h.patientId === patient.id);

  return (
    <>
      <PageHeader
        title={patient.name}
        description={`Paciente desde 12/03/2024 • ${patient.type}`}
        action={
          <div className="flex gap-2">
            <button className="button">
              <MessageCircle size={16} />
              WhatsApp
            </button>
            <button className="button button-primary">
              <CalendarPlus size={16} />
              Novo agendamento
            </button>
          </div>
        }
      />
      <div
        role="tablist"
        className="mb-4 flex gap-1 overflow-auto border-b border-[var(--border)]"
      >
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${tab === t ? "border-b-2 border-[var(--primary)] text-[var(--primary)]" : "muted"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Resumo" && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <section className="panel p-5">
            <h2 className="font-bold">Dados pessoais</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs muted">Nome completo</p>
                <p className="mt-1 text-sm font-medium">{patient.name}</p>
              </div>
              <div>
                <p className="text-xs muted">CPF</p>
                <p className="mt-1 text-sm font-medium">{patient.cpf}</p>
              </div>
              <div>
                <p className="text-xs muted">Telefone</p>
                <p className="mt-1 flex items-center gap-2 text-sm">
                  <Phone size={14} />
                  {patient.phone}
                </p>
              </div>
              <div>
                <p className="text-xs muted">E-mail</p>
                <p className="mt-1 flex items-center gap-2 text-sm">
                  <Mail size={14} />
                  paciente@email.com
                </p>
              </div>
              <div>
                <p className="text-xs muted">Convênio</p>
                <p className="mt-1 text-sm">{patient.insurance}</p>
              </div>
              <div>
                <p className="text-xs muted">Status</p>
                <p className="mt-1">
                  <StatusBadge status={patient.status} />
                </p>
              </div>
            </div>
          </section>
          <section className="panel p-5">
            <h2 className="font-bold">Próxima consulta</h2>
            {patient.next === "—" ? (
              <p className="mt-4 text-sm muted">
                Nenhuma consulta futura marcada.
              </p>
            ) : (
              <>
                <p className="mt-4 text-lg font-bold text-[var(--primary)]">
                  {patient.next}
                </p>
                <p className="mt-1 text-sm">{patient.professional}</p>
                <p className="mt-4 text-xs muted">
                  Clínica Sorriso — Unidade Centro
                </p>
              </>
            )}
          </section>
          <section className="panel p-5 lg:col-span-2">
            <h2 className="font-bold">Indicadores</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                ["Consultas", "14"],
                ["Última", patient.last],
                ["Faltas", "1"],
                ["Cancelamentos", "2"],
                ["Pendência", brl(patient.balance)],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs muted">{l}</p>
                  <p className="mt-1 font-bold">{v}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "Agendamentos" && (
        <section className="panel">
          {events.length === 0 ? (
            <div className="p-10 text-center text-sm muted">
              Nenhum agendamento registrado para este paciente.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Procedimento</th>
                    <th>Profissional</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((a) => (
                    <tr key={`${a.date}-${a.time}`}>
                      <td>{a.date}</td>
                      <td>{a.time}</td>
                      <td className="font-medium">{a.procedure}</td>
                      <td>{a.professional}</td>
                      <td>{a.type}</td>
                      <td>{brl(a.value)}</td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "Financeiro" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="panel p-4">
              <p className="text-xs muted">Saldo pendente</p>
              <p
                className={`mt-1 text-lg font-bold ${patient.balance ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
              >
                {brl(patient.balance)}
              </p>
            </div>
            <div className="panel p-4">
              <p className="text-xs muted">Total pago em 2026</p>
              <p className="mt-1 text-lg font-bold">
                {brl(
                  finance
                    .filter((t) => t.status === "Pago")
                    .reduce((sum, t) => sum + t.amount, 0),
                )}
              </p>
            </div>
          </div>
          <section className="panel">
            {finance.length === 0 ? (
              <div className="p-10 text-center text-sm muted">
                Nenhuma movimentação financeira para este paciente.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Forma</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.map((t) => (
                      <tr key={t.description}>
                        <td>{t.date}</td>
                        <td className="font-medium">{t.description}</td>
                        <td>{t.method}</td>
                        <td className="text-[var(--success)]">
                          {brl(t.amount)}
                        </td>
                        <td>
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "Documentos" && (
        <section className="panel grid place-items-center p-12 text-center">
          <FileText size={28} className="muted" />
          <p className="mt-3 text-sm font-semibold">Nenhum documento enviado</p>
          <p className="mt-1 max-w-[360px] text-xs muted">
            Radiografias, termos de consentimento e outros arquivos do paciente
            aparecerão aqui.
          </p>
          <button className="button mt-4">Enviar documento</button>
        </section>
      )}

      {tab === "Histórico" && (
        <section className="panel p-5">
          {history.length === 0 ? (
            <p className="p-5 text-center text-sm muted">
              Nenhum registro no histórico deste paciente.
            </p>
          ) : (
            <ol className="space-y-5">
              {history.map((h) => (
                <li
                  key={`${h.date}-${h.text}`}
                  className="border-l-2 border-[var(--border)] pl-4"
                >
                  <p className="text-xs muted">
                    {h.date} • {h.author}
                  </p>
                  <p className="mt-1 text-sm">{h.text}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </>
  );
}
