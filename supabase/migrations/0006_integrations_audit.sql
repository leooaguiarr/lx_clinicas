-- 0006_integrations_audit.sql
-- Tokens de integração por clínica (n8n) e trilha de auditoria (§14, §18).

create table integration_tokens (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,                    -- ex.: "n8n produção"
  token_hash text not null,              -- guardamos o hash, nunca o token puro
  token_prefix text,                     -- primeiros caracteres, para exibição
  scopes text[],
  active boolean not null default true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz                 -- rotação/revogação de token
);

create index on integration_tokens (clinic_id);
create unique index on integration_tokens (token_hash);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,                  -- ex.: 'appointment.cancel'
  entity_type text not null,             -- ex.: 'appointment'
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index on audit_logs (clinic_id, created_at desc);
create index on audit_logs (entity_type, entity_id);
