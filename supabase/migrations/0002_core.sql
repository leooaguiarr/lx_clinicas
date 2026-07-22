-- 0002_core.sql
-- Organização e acesso: clínicas, perfis (espelho de auth.users) e vínculos.

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- nome fantasia
  legal_name text,                       -- razão social
  document text,                         -- CPF ou CNPJ
  phone text,
  whatsapp text,
  email text,
  address text,
  logo_url text,
  main_specialty text,                   -- especialidade principal
  timezone text not null default 'America/Sao_Paulo',
  default_appointment_minutes integer not null default 30,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dados públicos do usuário, ligados 1:1 a auth.users (Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Vínculo usuário <-> clínica, com papel e situação
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
