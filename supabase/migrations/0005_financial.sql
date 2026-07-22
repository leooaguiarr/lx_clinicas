-- 0005_financial.sql
-- Financeiro básico: receitas e despesas (§10).

create table financial_transactions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid references patients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  professional_id uuid references professionals(id) on delete set null,
  type transaction_type not null,        -- income | expense
  category text,
  description text not null,
  amount numeric(12, 2) not null,
  due_date date,
  paid_at timestamptz,
  payment_method payment_method,
  status financial_status not null default 'pending',
  supplier text,                         -- fornecedor (despesas)
  recurring boolean not null default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on financial_transactions (clinic_id, due_date);
create index on financial_transactions (clinic_id, status);
create index on financial_transactions (patient_id);
create index on financial_transactions (appointment_id);

create trigger trg_financial_transactions_updated_at
  before update on financial_transactions
  for each row execute function set_updated_at();
