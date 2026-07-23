import { redirect } from "next/navigation";
import { AlertCircle, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SummaryCard } from "@/components/summary-card";
import { requireSession } from "@/lib/auth/session";
import { FINANCE_ROLES } from "@/lib/domain";
import { getFinancialOverview } from "@/lib/queries/financial";
import { brl } from "@/lib/utils";

export default async function Financeiro() {
  const session = await requireSession();
  // O perfil "profissional" não enxerga o financeiro (seção 5.3 da SPEC).
  if (!FINANCE_ROLES.includes(session.role)) redirect("/agenda");

  const data = await getFinancialOverview(session.clinicId, session.timezone);
  const chartMax = Math.max(1, ...data.chart.flatMap((item) => [item.income, item.expense]));

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Visão simples das entradas, saídas e pendências"
        action={<button className="button button-primary">Nova movimentação</button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-6">
        <SummaryCard label="Recebido hoje" value={brl(data.cards.receivedToday)} icon={TrendingUp} />
        <SummaryCard label="No mês" value={brl(data.cards.receivedThisMonth)} />
        <SummaryCard label="A receber" value={brl(data.cards.toReceive)} />
        <SummaryCard label="Despesas" value={brl(data.cards.expenses)} icon={TrendingDown} />
        <SummaryCard label="Saldo" value={brl(data.cards.balance)} icon={Wallet} />
        <SummaryCard label="Inadimplência" value={brl(data.cards.overdue)} icon={AlertCircle} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-5">
          <h2 className="font-bold">Fluxo dos últimos meses</h2>
          <div className="mt-8 flex h-52 items-end gap-3 border-b border-l border-[var(--border)] px-4">
            {data.chart.map((month) => (
              <div key={month.label} className="flex flex-1 items-end gap-1" title={`${month.label}: ${brl(month.income)} / ${brl(month.expense)}`}>
                <span className="w-1/2 rounded-t bg-[var(--primary)]" style={{ height: `${(month.income / chartMax) * 100}%` }} />
                <span className="w-1/2 rounded-t bg-[#d9e4e8]" style={{ height: `${(month.expense / chartMax) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 px-4 text-[10px] muted">
            {data.chart.map((month) => (
              <span key={month.label} className="flex-1 text-center">{month.label}</span>
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
            {data.statusBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{item.label}</span>
                  <b>{brl(item.amount)}</b>
                </div>
                <div className="h-2 rounded-full bg-[#edf2f4]">
                  <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${item.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel mt-4">
        <div className="flex flex-wrap justify-between gap-2 border-b border-[var(--border)] p-4">
          <h2 className="font-bold">Movimentações recentes</h2>
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
              {data.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td className="font-medium">{transaction.description}</td>
                  <td>{transaction.category}</td>
                  <td>{transaction.method}</td>
                  <td className={transaction.amount < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}>{brl(transaction.amount)}</td>
                  <td><StatusBadge status={transaction.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.transactions.length === 0 && (
            <div className="p-10 text-center text-sm muted">Nenhuma movimentação registrada.</div>
          )}
        </div>
      </section>
    </>
  );
}
