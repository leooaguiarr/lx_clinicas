"use client";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryCard } from "@/components/summary-card";
import { StatusBadge } from "@/components/status-badge";
import { transactions, type Transaction } from "@/lib/mock-data";
import { brl } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react";

const statusOptions = [
  "Todos os status",
  "Pago",
  "Pendente",
  "Parcial",
  "Atrasado",
] as const;

export default function Financeiro() {
  const [status, setStatus] =
    useState<(typeof statusOptions)[number]>("Todos os status");
  const filtered = transactions.filter(
    (t: Transaction) => status === "Todos os status" || t.status === status,
  );
  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Visão simples das entradas, saídas e pendências"
        action={
          <button className="button button-primary">Nova movimentação</button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-6">
        <SummaryCard label="Recebido hoje" value="R$ 2.480" icon={TrendingUp} />
        <SummaryCard label="No mês" value="R$ 38.740" />
        <SummaryCard label="A receber" value="R$ 9.820" />
        <SummaryCard label="Despesas" value="R$ 12.460" icon={TrendingDown} />
        <SummaryCard label="Saldo" value="R$ 26.280" icon={Wallet} />
        <SummaryCard
          label="Inadimplência"
          value="R$ 2.140"
          icon={AlertCircle}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Fluxo do mês</h2>
            <select className="select !w-auto">
              <option>Julho de 2026</option>
            </select>
          </div>
          <div className="mt-8 flex h-52 items-end gap-3 border-b border-l border-[var(--border)] px-4">
            {[45, 68, 51, 84, 63, 91, 72, 88].map((h, i) => (
              <div key={i} className="flex h-full flex-1 items-end gap-1">
                <span
                  className="w-1/2 rounded-t bg-[var(--primary)]"
                  style={{ height: `${h}%` }}
                />
                <span
                  className="w-1/2 rounded-t bg-[#d9e4e8]"
                  style={{ height: `${Math.max(20, h - 35)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-5 text-xs muted">
            <span>● Receitas</span>
            <span className="text-[#9cafb7]">● Despesas</span>
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-bold">Status dos recebimentos</h2>
          <div className="mt-6 space-y-5">
            {[
              ["Pagos", 72, "R$ 38.740"],
              ["Pendentes", 19, "R$ 7.680"],
              ["Em atraso", 9, "R$ 2.140"],
            ].map(([l, n, v]) => (
              <div key={String(l)}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{l}</span>
                  <b>{v}</b>
                </div>
                <div className="h-2 rounded-full bg-[#edf2f4]">
                  <div
                    className="h-2 rounded-full bg-[var(--primary)]"
                    style={{ width: `${n}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel mt-4">
        <div className="flex flex-wrap justify-between gap-2 border-b border-[var(--border)] p-4">
          <h2 className="font-bold">Movimentações recentes</h2>
          <select
            className="select !w-auto"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as (typeof statusOptions)[number])
            }
          >
            {statusOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Forma</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.description}>
                  <td>{t.date}</td>
                  <td className="font-medium">{t.description}</td>
                  <td>{t.category}</td>
                  <td>{t.method}</td>
                  <td
                    className={
                      t.amount < 0
                        ? "text-[var(--danger)]"
                        : "text-[var(--success)]"
                    }
                  >
                    {brl(t.amount)}
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm muted">
              Nenhuma movimentação com este status.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
