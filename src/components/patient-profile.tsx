"use client";

import { useState } from "react";
import {
  CalendarPlus,
  FileText,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import type { PatientDetail } from "@/lib/queries/patients";
import { brl } from "@/lib/utils";

const tabs = [
  "Resumo",
  "Agendamentos",
  "Financeiro",
  "Documentos",
  "Histórico",
] as const;

type Tab = (typeof tabs)[number];

export function PatientProfile({
  patient,
  clinicName,
}: {
  patient: PatientDetail;
  clinicName: string;
}) {
  const [tab, setTab] = useState<Tab>("Resumo");

  const whatsapp = `https://wa.me/${patient.phone.replace(/\D/g, "").replace(/^(?!55)/, "55")}`;

  return (
    <>
      <PageHeader
        title={patient.name}
        description={`Paciente desde ${patient.createdAt} • ${patient.careType}`}
        action={
          <div className="flex gap-2">
            <a
              className="button"
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <a className="button button-primary" href="/agenda">
              <CalendarPlus size={16} />
              Novo agendamento
            </a>
          </div>
        }
      />

      {/* Navegação por abas */}
      <div
        role="tablist"
        className="mb-5 flex gap-1 overflow-x-auto border-b border-[var(--border)]"
      >
        {tabs.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                  : "muted hover:text-[var(--text-primary)]"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Aba 1: Resumo */}
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
                <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <Phone size={14} className="text-[var(--text-secondary)]" />
                  {patient.phone}
                </p>
              </div>
              <div>
                <p className="text-xs muted">E-mail</p>
                <p className="mt-1 flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-[var(--text-secondary)]" />
                  {patient.email}
                </p>
              </div>
              <div>
                <p className="text-xs muted">Nascimento</p>
                <p className="mt-1 text-sm">{patient.birthDate}</p>
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
            {patient.nextAppointment ? (
              <>
                <p className="mt-4 text-lg font-bold text-[var(--primary)]">
                  {patient.nextAppointment.date}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {patient.nextAppointment.procedure} • {patient.nextAppointment.professional}
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm muted">Nenhuma consulta agendada.</p>
            )}
            <p className="mt-4 text-xs muted">{clinicName}</p>
          </section>

          <section className="panel p-5 lg:col-span-2">
            <h2 className="font-bold">Indicadores</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                ["Consultas", String(patient.stats.total)],
                ["Última", patient.stats.last],
                ["Faltas", String(patient.stats.noShows)],
                ["Cancelamentos", String(patient.stats.cancellations)],
                ["Pendência", brl(patient.stats.balance)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs muted">{label}</p>
                  <p
                    className={`mt-1 font-bold ${
                      label === "Pendência" && patient.stats.balance > 0
                        ? "text-[var(--danger)]"
                        : ""
                    }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Aba 2: Agendamentos */}
      {tab === "Agendamentos" && (
        <section className="panel">
          {patient.appointments.length === 0 ? (
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
                  {patient.appointments.map((a) => (
                    <tr key={a.id}>
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

      {/* Aba 3: Financeiro */}
      {tab === "Financeiro" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="panel p-4">
              <p className="text-xs muted">Saldo em aberto</p>
              <p
                className={`mt-1 text-lg font-bold ${
                  patient.financialSummary.balance > 0
                    ? "text-[var(--danger)]"
                    : "text-[var(--success)]"
                }`}
              >
                {brl(patient.financialSummary.balance)}
              </p>
            </div>
            <div className="panel p-4">
              <p className="text-xs muted">Total pago</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {brl(patient.financialSummary.totalPaidThisYear)}
              </p>
            </div>
          </div>

          <section className="panel">
            {patient.transactions.length === 0 ? (
              <div className="p-10 text-center text-sm muted">
                Nenhuma movimentação financeira registrada para este paciente.
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
                    {patient.transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td className="font-medium">{t.description}</td>
                        <td>{t.method}</td>
                        <td className="font-semibold text-[var(--text-primary)]">
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

      {/* Aba 4: Documentos */}
      {tab === "Documentos" && (
        <section className="panel grid place-items-center p-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#f1f5f9]">
            <FileText size={24} className="text-[var(--text-secondary)]" />
          </div>
          <p className="mt-4 text-sm font-semibold">Nenhum documento enviado</p>
          <p className="mt-1 max-w-[360px] text-xs muted">
            Radiografias, termos de consentimento, laudos e receitas do paciente
            aparecerão aqui.
          </p>
          <button className="button mt-5" type="button">
            Enviar documento
          </button>
        </section>
      )}

      {/* Aba 5: Histórico */}
      {tab === "Histórico" && (
        <section className="panel p-6">
          <h2 className="mb-4 font-bold">Linha do tempo do paciente</h2>
          {patient.history.length === 0 ? (
            <p className="p-5 text-center text-sm muted">
              Nenhum registro no histórico deste paciente.
            </p>
          ) : (
            <ol className="space-y-6">
              {patient.history.map((h) => (
                <li
                  key={h.id}
                  className="relative border-l-2 border-[var(--border)] pl-4"
                >
                  <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[var(--primary)]" />
                  <p className="text-xs font-semibold muted">
                    {h.date} • {h.author}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-primary)] font-medium">
                    {h.text}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </>
  );
}
