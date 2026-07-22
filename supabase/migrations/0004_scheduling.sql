-- 0004_scheduling.sql
-- Operação da agenda: pacientes, bloqueios e agendamentos.

create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  normalized_phone text not null,        -- E.164, ex.: +5535999999999
  phone_display text,                    -- como exibir, ex.: (35) 99999-9999
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
  -- Unicidade do paciente por clínica pelo telefone normalizado (§8.4)
  unique (clinic_id, normalized_phone)
);

create index on patients (clinic_id);
create index on patients (clinic_id, cpf);

-- Bloqueios de agenda (impedem novos agendamentos no intervalo)
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
  -- Referência ao agendamento anterior em caso de reagendamento (§7.8)
  previous_appointment_id uuid references appointments(id),
  -- Integração Chatwoot / n8n (§7.6, §14)
  chatwoot_contact_id text,
  chatwoot_conversation_id text,
  n8n_execution_id text,
  idempotency_key text,                  -- idempotência de criação via n8n
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index on appointments (clinic_id, start_at);
create index on appointments (professional_id, start_at);
create index on appointments (patient_id);

-- Idempotência: uma mesma chave só cria um agendamento por clínica
create unique index appointments_idempotency_uniq
  on appointments (clinic_id, idempotency_key)
  where idempotency_key is not null;

-- Regra de negócio central (§7.8): nenhum profissional pode ter dois
-- agendamentos ativos no mesmo intervalo. Garantido no próprio banco.
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
