import { redirect } from "next/navigation";
import { AlertCircle, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { FinancialTransactionsTable } from "@/components/financial-transactions-table";
import { PageHeader } from "@/components/page-header";
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
          <div className="mt-8 flex h-52 items-end gap-3 border-b border-l border-[var(--border)] px-4 pb-0.5">
            {data.chart.map((month) => (
              <div
                key={month.label}
                className="flex flex-1 items-end gap-1 h-full"
                title={`${month.label}: ${brl(month.income)} / ${brl(month.expense)}`}
              >
                <span
                  className="w-1/2 rounded-t bg-[var(--primary)] transition-all"
                  style={{
                    height: `${month.income > 0 ? Math.max(4, (month.income / chartMax) * 100) : 0}%`,
                  }}
                />
                <span
                  className="w-1/2 rounded-t bg-[#cbd5e1] transition-all"
                  style={{
                    height: `${month.expense > 0 ? Math.max(4, (month.expense / chartMax) * 100) : 0}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 px-4 text-[10px] muted">
            {data.chart.map((month) => (
              <span key={month.label} className="flex-1 text-center font-medium">
                {month.label}
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-5 text-xs muted">
            <span className="flex items-center gap-1.5 font-medium text-[var(--primary)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" /> Receitas
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#cbd5e1]" /> Despesas
            </span>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-bold">Status dos recebimentos</h2>
          <div className="mt-6 space-y-5">
            {data.statusBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-[var(--text-secondary)]">{item.label}</span>
                  <b>{brl(item.amount)}</b>
                </div>
                <div className="h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[var(--primary)]"
                    style={{ width: `${item.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <FinancialTransactionsTable transactions={data.transactions} />
    </>
  );
}
