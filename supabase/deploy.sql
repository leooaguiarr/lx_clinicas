-- =============================================================================
-- deploy.sql — Lx Clínicas: reset completo + schema novo + dados de exemplo
-- =============================================================================
-- Gerado em 2026-07-22. Rodar como superusuário (postgres) via psql ou SQL Editor.
--
-- O que este script faz:
--   1. Dropa TODAS as tabelas do schema public (Lava Rápido) com CASCADE
--   2. Remove enums/types antigos do public
--   3. Limpa auth.users (usuários do projeto anterior)
--   4. Cria extensões, enums, tabelas, índices, triggers (0001–0006)
--   5. Cria funções RLS e policies (0007)
--   6. Insere dados de exemplo — seed (1 clínica, 3 profissionais, 5 pacientes)
--
-- BACKUP JÁ FEITO: /tmp/backup_lava_rapido_20260722.sql
-- =============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 0: LIMPAR SCHEMA ANTIGO (Lava Rápido)
-- ─────────────────────────────────────────────────────────────────────────────

-- Dropa todas as tabelas do public (ordem não importa com CASCADE)
do $$
declare
  r record;
begin
  for r in (
    select tablename from pg_tables where schemaname = 'public'
  ) loop
    execute 'drop table if exists public.' || quote_ident(r.tablename) || ' cascade';
  end loop;
end;
$$;

-- Remove tipos/enums antigos do public (se existirem)
do $$
declare
  r record;
begin
  for r in (
    select typname from pg_type
    where typnamespace = 'public'::regnamespace
      and typtype = 'e'
  ) loop
    execute 'drop type if exists public.' || quote_ident(r.typname) || ' cascade';
  end loop;
end;
$$;

-- Remove funções antigas do public (exceto as do Supabase/sistema)
do $$
declare
  r record;
begin
  for r in (
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
  ) loop
    execute 'drop function if exists ' || r.sig || ' cascade';
  end loop;
end;
$$;

-- Limpa usuários do projeto anterior (auth.users do Supabase Auth)
delete from auth.users;

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 1: EXTENSÕES, ENUMS E FUNÇÃO UTILITÁRIA (0001_init.sql)
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type care_type as enum ('private', 'insurance');

create type appointment_status as enum (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

create type appointment_source as enum (
  'reception',
  'whatsapp',
  'ai_agent',
  'booking_link',
  'professional',
  'import'
);

create type payment_method as enum (
  'cash',
  'pix',
  'debit_card',
  'credit_card',
  'bank_slip',
  'insurance',
  'other'
);

create type financial_status as enum (
  'pending',
  'paid',
  'partial',
  'overdue',
  'cancelled'
);

create type transaction_type as enum ('income', 'expense');

create type clinic_role as enum ('admin', 'reception', 'professional', 'finance');

create type member_status as enum ('active', 'invited', 'inactive');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 2: TABELAS CORE (0002_core.sql)
-- ─────────────────────────────────────────────────────────────────────────────

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  document text,
  phone text,
  whatsapp text,
  email text,
  address text,
  logo_url text,
  main_specialty text,
  timezone text not null default 'America/Sao_Paulo',
  default_appointment_minutes integer not null default 30,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role clinic_role not null,
  status member_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create index on clinic_members (user_id);
create index on clinic_members (clinic_id);

create trigger trg_clinics_updated_at
  before update on clinics
  for each row execute function set_updated_at();

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 3: CATÁLOGO CLÍNICO (0003_catalog.sql)
-- ─────────────────────────────────────────────────────────────────────────────

create table professionals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  specialty text,
  council_type text,
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
  private_price numeric(12, 2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on procedures (clinic_id);

create table insurance_companies (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  registration_code text,
  average_payment_days integer,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on insurance_companies (clinic_id);

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

create unique index procedure_price_company_uniq
  on procedure_insurance_prices (procedure_id, insurance_company_id)
  where insurance_plan_id is null;
create unique index procedure_price_plan_uniq
  on procedure_insurance_prices (procedure_id, insurance_company_id, insurance_plan_id)
  where insurance_plan_id is not null;

create table professional_procedures (
  clinic_id uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  procedure_id uuid not null references procedures(id) on delete cascade,
  primary key (professional_id, procedure_id)
);

create table professional_schedules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
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

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 4: AGENDA (0004_scheduling.sql)
-- ─────────────────────────────────────────────────────────────────────────────

create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  normalized_phone text not null,
  phone_display text,
  birth_date date,
  cpf text,
  email text,
  gender text,
  insurance_company_id uuid references insurance_companies(id) on delete set null,
  insurance_plan_id uuid references insurance_plans(id) on delete set null,
  insurance_card_number text,
  insurance_card_expiration date,
  main_professional_id uuid references professionals(id) on delete set null,
  communication_consent boolean not null default false,
  notes text,
  source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, normalized_phone)
);

create index on patients (clinic_id);
create index on patients (clinic_id, cpf);

create table calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index on calendar_blocks (professional_id, start_at);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete restrict,
  professional_id uuid not null references professionals(id) on delete restrict,
  procedure_id uuid references procedures(id) on delete set null,
  insurance_company_id uuid references insurance_companies(id) on delete set null,
  insurance_plan_id uuid references insurance_plans(id) on delete set null,
  care_type care_type not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status appointment_status not null default 'scheduled',
  expected_value numeric(12, 2),
  received_value numeric(12, 2) default 0,
  source appointment_source not null default 'reception',
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  previous_appointment_id uuid references appointments(id),
  chatwoot_contact_id text,
  chatwoot_conversation_id text,
  n8n_execution_id text,
  idempotency_key text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index on appointments (clinic_id, start_at);
create index on appointments (professional_id, start_at);
create index on appointments (patient_id);

create unique index appointments_idempotency_uniq
  on appointments (clinic_id, idempotency_key)
  where idempotency_key is not null;

alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    professional_id with =,
    tstzrange(start_at, end_at) with &&
  )
  where (status in ('scheduled', 'confirmed', 'completed'));

create trigger trg_patients_updated_at
  before update on patients
  for each row execute function set_updated_at();

create trigger trg_appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 5: FINANCEIRO (0005_financial.sql)
-- ─────────────────────────────────────────────────────────────────────────────

create table financial_transactions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid references patients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  professional_id uuid references professionals(id) on delete set null,
  type transaction_type not null,
  category text,
  description text not null,
  amount numeric(12, 2) not null,
  due_date date,
  paid_at timestamptz,
  payment_method payment_method,
  status financial_status not null default 'pending',
  supplier text,
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

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 6: INTEGRAÇÕES E AUDITORIA (0006_integrations_audit.sql)
-- ─────────────────────────────────────────────────────────────────────────────

create table integration_tokens (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  token_hash text not null,
  token_prefix text,
  scopes text[],
  active boolean not null default true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index on integration_tokens (clinic_id);
create unique index on integration_tokens (token_hash);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index on audit_logs (clinic_id, created_at desc);
create index on audit_logs (entity_type, entity_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 7: RLS — ISOLAMENTO MULTIEMPRESA (0007_rls.sql)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function current_clinic_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id
  from clinic_members
  where user_id = auth.uid()
    and status = 'active';
$$;

create or replace function is_clinic_member(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from clinic_members
    where user_id = auth.uid()
      and clinic_id = target_clinic_id
      and status = 'active'
  );
$$;

create or replace function has_clinic_role(target_clinic_id uuid, roles clinic_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from clinic_members
    where user_id = auth.uid()
      and clinic_id = target_clinic_id
      and status = 'active'
      and role = any(roles)
  );
$$;

alter table clinics enable row level security;
alter table profiles enable row level security;
alter table clinic_members enable row level security;
alter table professionals enable row level security;
alter table procedures enable row level security;
alter table insurance_companies enable row level security;
alter table insurance_plans enable row level security;
alter table procedure_insurance_prices enable row level security;
alter table professional_procedures enable row level security;
alter table professional_schedules enable row level security;
alter table patients enable row level security;
alter table calendar_blocks enable row level security;
alter table appointments enable row level security;
alter table financial_transactions enable row level security;
alter table integration_tokens enable row level security;
alter table audit_logs enable row level security;

create policy profiles_self_select on profiles
  for select using (id = auth.uid());
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy clinics_member_select on clinics
  for select using (is_clinic_member(id));
create policy clinics_admin_update on clinics
  for update using (has_clinic_role(id, array['admin']::clinic_role[]))
  with check (has_clinic_role(id, array['admin']::clinic_role[]));

create policy clinic_members_select on clinic_members
  for select using (is_clinic_member(clinic_id));
create policy clinic_members_admin_write on clinic_members
  for all using (has_clinic_role(clinic_id, array['admin']::clinic_role[]))
  with check (has_clinic_role(clinic_id, array['admin']::clinic_role[]));

do $$
declare
  t text;
  tables text[] := array[
    'professionals',
    'procedures',
    'insurance_companies',
    'insurance_plans',
    'procedure_insurance_prices',
    'professional_procedures',
    'professional_schedules',
    'patients',
    'calendar_blocks',
    'appointments',
    'audit_logs'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create policy %1$s_clinic_all on %1$s for all
         using (clinic_id in (select current_clinic_ids()))
         with check (clinic_id in (select current_clinic_ids()));',
      t
    );
  end loop;
end;
$$;

create policy financial_transactions_rw on financial_transactions
  for all
  using (has_clinic_role(clinic_id, array['admin', 'finance']::clinic_role[]))
  with check (has_clinic_role(clinic_id, array['admin', 'finance']::clinic_role[]));

create policy integration_tokens_admin on integration_tokens
  for all
  using (has_clinic_role(clinic_id, array['admin']::clinic_role[]))
  with check (has_clinic_role(clinic_id, array['admin']::clinic_role[]));

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 8: SEED — DADOS DE EXEMPLO (seed.sql)
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  v_clinic uuid := '00000000-0000-0000-0000-0000000c1171';
  v_marina uuid := '00000000-0000-0000-0000-00000000d001';
  v_rafael uuid := '00000000-0000-0000-0000-00000000d002';
  v_ana    uuid := '00000000-0000-0000-0000-00000000d003';
  v_unimed uuid := '00000000-0000-0000-0000-0000000c0001';
  v_brad   uuid := '00000000-0000-0000-0000-0000000c0002';
  v_amil   uuid := '00000000-0000-0000-0000-0000000c0003';
  v_beatriz uuid := '00000000-0000-0000-0000-0000000fa001';
  v_lucas   uuid := '00000000-0000-0000-0000-0000000fa002';
begin
  delete from clinics where id = v_clinic;

  insert into clinics (id, name, legal_name, document, phone, whatsapp, email,
    address, main_specialty, timezone, default_appointment_minutes)
  values (v_clinic, 'Clínica Sorriso', 'Sorriso Odontologia LTDA',
    '12.345.678/0001-90', '(35) 3333-1000', '(35) 99999-1000',
    'contato@clinicasorriso.com.br', 'Rua das Flores, 100 - Centro',
    'Odontologia', 'America/Sao_Paulo', 30);

  insert into professionals (id, clinic_id, full_name, specialty, council_type,
    council_number, calendar_color) values
    (v_marina, v_clinic, 'Dra. Marina Lopes', 'Clínico Geral', 'CRO', 'MG-12345', '#176B87'),
    (v_rafael, v_clinic, 'Dr. Rafael Costa', 'Endodontia', 'CRO', 'MG-23456', '#2F8FA3'),
    (v_ana,    v_clinic, 'Dra. Ana Beatriz', 'Ortodontia', 'CRO', 'MG-34567', '#7566B8');

  insert into insurance_companies (id, clinic_id, name, average_payment_days) values
    (v_unimed, v_clinic, 'Unimed', 30),
    (v_brad,   v_clinic, 'Bradesco Saúde', 45),
    (v_amil,   v_clinic, 'Amil Dental', 40);

  insert into procedures (clinic_id, name, category, default_duration_minutes, private_price) values
    (v_clinic, 'Avaliação', 'Consulta', 30, 180.00),
    (v_clinic, 'Limpeza', 'Preventivo', 60, 220.00),
    (v_clinic, 'Restauração', 'Dentística', 90, 420.00),
    (v_clinic, 'Clareamento', 'Estética', 60, 650.00),
    (v_clinic, 'Extração', 'Cirurgia', 60, 300.00),
    (v_clinic, 'Retorno', 'Consulta', 30, 0.00);

  insert into patients (id, clinic_id, full_name, normalized_phone, phone_display,
    cpf, main_professional_id, insurance_company_id, communication_consent) values
    (v_beatriz, v_clinic, 'Beatriz Almeida', '+5535999128432', '(35) 99912-8432',
      '123.456.789-00', v_marina, null, true),
    (v_lucas, v_clinic, 'Lucas Ferreira', '+5535988412093', '(35) 98841-2093',
      '234.567.890-11', v_rafael, v_unimed, true),
    (gen_random_uuid(), v_clinic, 'Camila Nogueira', '+5535997205518', '(35) 99720-5518',
      '345.678.901-22', v_ana, null, true),
    (gen_random_uuid(), v_clinic, 'Pedro Martins', '+5535991063374', '(35) 99106-3374',
      '456.789.012-33', v_marina, v_brad, false),
    (gen_random_uuid(), v_clinic, 'Mariana Silva', '+5535984136620', '(35) 98413-6620',
      '567.890.123-44', v_rafael, null, true);

  insert into appointments (clinic_id, patient_id, professional_id, procedure_id,
    care_type, start_at, end_at, status, expected_value, source) values
    (v_clinic, v_beatriz, v_marina,
      (select id from procedures where clinic_id = v_clinic and name = 'Avaliação'),
      'private', '2026-07-20T08:00:00-03:00', '2026-07-20T09:00:00-03:00',
      'confirmed', 180.00, 'reception'),
    (v_clinic, v_lucas, v_rafael,
      (select id from procedures where clinic_id = v_clinic and name = 'Limpeza'),
      'insurance', '2026-07-20T10:00:00-03:00', '2026-07-20T11:00:00-03:00',
      'scheduled', 120.00, 'ai_agent');

  insert into financial_transactions (clinic_id, patient_id, type, category,
    description, amount, payment_method, status, paid_at) values
    (v_clinic, v_beatriz, 'income', 'Procedimento',
      'Avaliação • Beatriz Almeida', 180.00, 'pix', 'paid', now()),
    (v_clinic, null, 'expense', 'Materiais',
      'Materiais odontológicos', 840.00, 'bank_slip', 'paid', now()),
    (v_clinic, v_lucas, 'income', 'Procedimento',
      'Limpeza • Lucas Ferreira', 120.00, 'insurance', 'pending', null);
end;
$$;

commit;
