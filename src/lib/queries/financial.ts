import { createClient } from "@/lib/supabase/server";
import { currentMonthRange, dateKey, dateLabel, zonedDateTime } from "@/lib/dates";
import { PAYMENT_METHOD_LABEL, TRANSACTION_STATUS_LABEL } from "@/lib/domain";
import type { PaymentMethod, TransactionStatus, TransactionType } from "@/types/database";

const MONTHS_IN_CHART = 8;

export type FinancialTransactionItem = {
  id: string;
  date: string;
  description: string;
  category: string;
  method: string;
  /** Despesas vêm negativas para a coluna de valor. */
  amount: number;
  status: string;
};

export type FinancialOverview = {
  cards: {
    receivedToday: number;
    receivedThisMonth: number;
    toReceive: number;
    expenses: number;
    balance: number;
    overdue: number;
  };
  chart: { label: string; income: number; expense: number }[];
  statusBreakdown: { label: string; amount: number; share: number }[];
  transactions: FinancialTransactionItem[];
};

type TransactionJoin = {
  id: string;
  type: TransactionType;
  category: string | null;
  description: string;
  amount: number;
  status: TransactionStatus;
  payment_method: PaymentMethod | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
};

export async function getFinancialOverview(clinicId: string, timezone: string): Promise<FinancialOverview> {
  const supabase = await createClient();

  const now = new Date();
  const month = currentMonthRange(now, timezone);
  const todayKey = dateKey(now, timezone);
  const dayStart = zonedDateTime(todayKey, "00:00", timezone);

  // Janela do gráfico: início do mês N-7.
  const [chartYear, chartMonth] = todayKey.split("-").map(Number);
  const windowStart = new Date(Date.UTC(chartYear, chartMonth - 1 - (MONTHS_IN_CHART - 1), 1));
  const chartStart = zonedDateTime(windowStart.toISOString().slice(0, 10), "00:00", timezone);

  const [windowResult, recentResult] = await Promise.all([
    supabase
      .from("financial_transactions")
      .select("id, type, category, description, amount, status, payment_method, due_date, paid_at, created_at")
      .eq("clinic_id", clinicId)
      .gte("created_at", chartStart.toISOString()),
    supabase
      .from("financial_transactions")
      .select("id, type, category, description, amount, status, payment_method, due_date, paid_at, created_at")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (windowResult.error) throw windowResult.error;
  if (recentResult.error) throw recentResult.error;

  const rows = ((windowResult.data ?? []) as TransactionJoin[]).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));

  const isPaid = (row: (typeof rows)[number]) => row.status === "paid";
  const isOpen = (row: (typeof rows)[number]) =>
    row.status === "pending" || row.status === "partial" || row.status === "overdue";
  const inMonth = (iso: string) => {
    const at = new Date(iso).getTime();
    return at >= month.start.getTime() && at < month.end.getTime();
  };
  const sum = (items: { amount: number }[]) => items.reduce((total, item) => total + item.amount, 0);

  const income = rows.filter((row) => row.type === "income");
  const expense = rows.filter((row) => row.type === "expense");

  const receivedToday = sum(
    income.filter((row) => isPaid(row) && row.paid_at !== null && new Date(row.paid_at).getTime() >= dayStart.getTime()),
  );
  const receivedThisMonth = sum(income.filter((row) => isPaid(row) && row.paid_at !== null && inMonth(row.paid_at)));
  const toReceive = sum(income.filter(isOpen));
  const expenses = sum(expense.filter((row) => isPaid(row) && row.paid_at !== null && inMonth(row.paid_at)));
  const overdue = sum(
    income.filter(
      (row) => isOpen(row) && (row.status === "overdue" || (row.due_date !== null && row.due_date < todayKey)),
    ),
  );

  // Gráfico: um par receita/despesa por mês da janela.
  const buckets = Array.from({ length: MONTHS_IN_CHART }, (_, index) => {
    // Meio-dia UTC para o rótulo não escorregar de mês em fusos negativos.
    const cursor = new Date(Date.UTC(chartYear, chartMonth - 1 - (MONTHS_IN_CHART - 1 - index), 1, 12));
    return {
      key: cursor.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("pt-BR", { timeZone: timezone, month: "short" }).format(cursor).replace(".", ""),
      income: 0,
      expense: 0,
    };
  });

  for (const row of rows) {
    const key = dateKey(new Date(row.paid_at ?? row.created_at), timezone).slice(0, 7);
    const bucket = buckets.find((item) => item.key === key);
    if (!bucket) continue;
    if (row.type === "income" && isPaid(row)) bucket.income += row.amount;
    if (row.type === "expense" && isPaid(row)) bucket.expense += row.amount;
  }

  const paidTotal = sum(income.filter(isPaid));
  const pendingTotal = sum(
    income.filter((row) => isOpen(row) && !(row.status === "overdue" || (row.due_date !== null && row.due_date < todayKey))),
  );
  const statusTotal = paidTotal + pendingTotal + overdue;
  const share = (value: number) => (statusTotal > 0 ? Math.round((value / statusTotal) * 100) : 0);

  return {
    cards: {
      receivedToday,
      receivedThisMonth,
      toReceive,
      expenses,
      balance: receivedThisMonth - expenses,
      overdue,
    },
    chart: buckets.map(({ label, income: value, expense: cost }) => ({ label, income: value, expense: cost })),
    statusBreakdown: [
      { label: "Pagos", amount: paidTotal, share: share(paidTotal) },
      { label: "Pendentes", amount: pendingTotal, share: share(pendingTotal) },
      { label: "Em atraso", amount: overdue, share: share(overdue) },
    ],
    transactions: ((recentResult.data ?? []) as TransactionJoin[]).map((row) => ({
      id: row.id,
      date: dateLabel(row.paid_at ?? row.created_at, timezone),
      description: row.description,
      category: row.category ?? (row.type === "income" ? "Receita" : "Despesa"),
      method: row.payment_method ? (PAYMENT_METHOD_LABEL[row.payment_method] ?? row.payment_method) : "—",
      amount: row.type === "expense" ? -Number(row.amount) : Number(row.amount),
      status: TRANSACTION_STATUS_LABEL[row.status],
    })),
  };
}
