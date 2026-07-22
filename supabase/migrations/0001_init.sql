-- 0001_init.sql
-- Extensões, tipos (enums canônicos em inglês) e função utilitária compartilhada.
-- O sistema é PT-BR na interface; o banco usa valores canônicos em inglês para
-- manter a API (consumida pelo n8n / agente de IA) estável e sem acentuação.

create extension if not exists pgcrypto; -- gen_random_uuid()
create extension if not exists btree_gist; -- constraint de não-sobreposição de agenda

-- Tipo de atendimento
create type care_type as enum ('private', 'insurance');

-- Status do agendamento (§7.4). Status futuros podem ser adicionados com
-- ALTER TYPE ... ADD VALUE (ex.: 'waiting_confirmation', 'patient_arrived').
create type appointment_status as enum (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

-- Origem do agendamento (§7.7)
create type appointment_source as enum (
  'reception',
  'whatsapp',
  'ai_agent',
  'booking_link',
  'professional',
  'import'
);

-- Formas de pagamento (§10.4)
create type payment_method as enum (
  'cash',
  'pix',
  'debit_card',
  'credit_card',
  'bank_slip',
  'insurance',
  'other'
);

-- Status financeiro (§10.5)
create type financial_status as enum (
  'pending',
  'paid',
  'partial',
  'overdue',
  'cancelled'
);

-- Tipo da movimentação financeira
create type transaction_type as enum ('income', 'expense');

-- Papéis do usuário dentro de uma clínica (§5)
create type clinic_role as enum ('admin', 'reception', 'professional', 'finance');

-- Situação do vínculo do usuário com a clínica
create type member_status as enum ('active', 'invited', 'inactive');

-- Atualiza automaticamente a coluna updated_at
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
