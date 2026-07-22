-- 0007_rls.sql
-- Isolamento multiempresa com Row Level Security.
--
-- Princípio: um usuário só enxerga/altera linhas das clínicas onde é membro
-- ativo. As funções auxiliares são SECURITY DEFINER para não recursar nas
-- policies de clinic_members. O papel service_role (usado pelo backend/n8n)
-- ignora RLS automaticamente.

-- Clínicas às quais o usuário logado pertence (membro ativo)
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

-- Usuário é membro ativo da clínica informada?
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

-- Usuário tem algum dos papéis informados na clínica?
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

-- Habilita RLS em todas as tabelas de negócio
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

-- profiles: cada usuário lê/edita apenas o próprio perfil
create policy profiles_self_select on profiles
  for select using (id = auth.uid());
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- clinics: membros leem a própria clínica; apenas admin altera
create policy clinics_member_select on clinics
  for select using (is_clinic_member(id));
create policy clinics_admin_update on clinics
  for update using (has_clinic_role(id, array['admin']::clinic_role[]))
  with check (has_clinic_role(id, array['admin']::clinic_role[]));

-- clinic_members: membros veem os colegas da clínica; apenas admin gerencia
create policy clinic_members_select on clinic_members
  for select using (is_clinic_member(clinic_id));
create policy clinic_members_admin_write on clinic_members
  for all using (has_clinic_role(clinic_id, array['admin']::clinic_role[]))
  with check (has_clinic_role(clinic_id, array['admin']::clinic_role[]));

-- Tabelas com isolamento simples por clínica: qualquer membro ativo pode
-- ler e escrever dentro da própria clínica. Refinamentos por papel podem ser
-- adicionados depois (ver financeiro e tokens abaixo).
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

-- financial_transactions: visível/gerenciável apenas por admin e financeiro (§5)
create policy financial_transactions_rw on financial_transactions
  for all
  using (has_clinic_role(clinic_id, array['admin', 'finance']::clinic_role[]))
  with check (has_clinic_role(clinic_id, array['admin', 'finance']::clinic_role[]));

-- integration_tokens: apenas admin (segredos de integração — §5 recepção não acessa)
create policy integration_tokens_admin on integration_tokens
  for all
  using (has_clinic_role(clinic_id, array['admin']::clinic_role[]))
  with check (has_clinic_role(clinic_id, array['admin']::clinic_role[]));
