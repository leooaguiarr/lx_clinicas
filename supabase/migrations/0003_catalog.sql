-- 0003_catalog.sql
-- Cadastros clínicos: profissionais, procedimentos, convênios/planos,
-- preços por convênio, procedimentos autorizados por profissional e horários.

create table professionals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  specialty text,
  council_type text,                     -- ex.: CRO
  council_number text,
  phone text,
  email text,
  calendar_color text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on professionals (clinic_id);

create table procedures (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  category text,
  default_duration_minutes integer not null default 30,
  private_price numeric(12, 2),          -- valor particular
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on procedures (clinic_id);

-- Convênios (§11)
create table insurance_companies (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  registration_code text,                -- registro (ANS etc.)
  average_payment_days integer,          -- prazo médio de recebimento
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on insurance_companies (clinic_id);

-- Planos de cada convênio
create table insurance_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  insurance_company_id uuid not null references insurance_companies(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on insurance_plans (insurance_company_id);

-- Valor/duração de um procedimento por convênio (e opcionalmente por plano).
-- Um procedimento pode ter valores diferentes por convênio (§7.8).
create table procedure_insurance_prices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  procedure_id uuid not null references procedures(id) on delete cascade,
  insurance_company_id uuid not null references insurance_companies(id) on delete cascade,
  insurance_plan_id uuid references insurance_plans(id) on delete cascade,
  price numeric(12, 2),
  duration_minutes integer,
  requires_authorization boolean not null default false,
  internal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unicidade tratando o plano nulo (convênio sem plano específico) corretamente
create unique index procedure_price_company_uniq
  on procedure_insurance_prices (procedure_id, insurance_company_id)
  where insurance_plan_id is null;
create unique index procedure_price_plan_uniq
  on procedure_insurance_prices (procedure_id, insurance_company_id, insurance_plan_id)
  where insurance_plan_id is not null;

-- Procedimentos que cada profissional está autorizado a executar (§12.3)
create table professional_procedures (
  clinic_id uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  procedure_id uuid not null references procedures(id) on delete cascade,
  primary key (professional_id, procedure_id)
);

-- Janelas de atendimento por profissional e dia da semana (§17.7)
create table professional_schedules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  appointment_interval_minutes integer not null default 30,
  active boolean not null default true,
  check (end_time > start_time)
);

create index on professional_schedules (professional_id, weekday);

create trigger trg_professionals_updated_at
  before update on professionals
  for each row execute function set_updated_at();

create trigger trg_procedures_updated_at
  before update on procedures
  for each row execute function set_updated_at();

create trigger trg_insurance_companies_updated_at
  before update on insurance_companies
  for each row execute function set_updated_at();

create trigger trg_insurance_plans_updated_at
  before update on insurance_plans
  for each row execute function set_updated_at();

create trigger trg_procedure_insurance_prices_updated_at
  before update on procedure_insurance_prices
  for each row execute function set_updated_at();
