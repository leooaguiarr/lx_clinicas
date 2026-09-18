"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { brl } from "@/lib/utils";

type TransactionItem = {
  id: string;
  date: string;
  description: string;
  category: string;
  method: string;
  amount: number;
  status: string;
};

export function FinancialTransactionsTable({
  transactions,
}: {
  transactions: TransactionItem[];
}) {
  const [selectedStatus, setSelectedStatus] = useState<string>("Todos os status");

  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(transactions.map((t) => t.status))).filter(Boolean);
    return ["Todos os status", ...statuses];
  }, [transactions]);

  const filtered = useMemo(() => {
    if (selectedStatus === "Todos os status") return transactions;
    return transactions.filter((t) => t.status === selectedStatus);
  }, [transactions, selectedStatus]);

  return (
    <section className="panel mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] p-4">
        <h2 className="font-bold">Movimentações recentes</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="transaction-status-filter" className="text-xs muted">
            Filtrar:
          </label>
          <select
            id="transaction-status-filter"
            className="select !h-9 !w-auto text-xs"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
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
            {filtered.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.date}</td>
                <td className="font-medium">{transaction.description}</td>
                <td>{transaction.category}</td>
                <td>{transaction.method}</td>
                <td
                  className={
                    transaction.amount < 0
                      ? "font-semibold text-[var(--danger)]"
                      : "font-semibold text-[var(--success)]"
                  }
                >
                  {brl(transaction.amount)}
                </td>
                <td>
                  <StatusBadge status={transaction.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm muted">
            Nenhuma movimentação com o status selecionado.
          </div>
        )}
      </div>
    </section>
  );
}
