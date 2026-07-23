# Banco de dados

O schema **já existe** na instância Supabase self-hosted e não é versionado neste repositório.
Ele foi criado fora deste projeto e é mais completo que a seção 17 da SPEC.

Não há migrations aqui de propósito: escrever `create table` a partir da SPEC produziria
um schema divergente do real. Se for necessário versionar, o caminho é extrair o schema
atual do banco (`pg_dump --schema-only`) e adotá-lo como baseline.

## Estado verificado

RLS está **ativa e funcionando**: consultas com a chave `anon` sem sessão de usuário
retornam vazio em todas as tabelas.

### Tabelas (16)

| Tabela | Observação |
| --- | --- |
| `clinics` | tem `whatsapp`, `address`, `main_specialty`, `default_appointment_minutes` além do previsto na SPEC |
| `profiles` | conforme SPEC |
| `clinic_members` | conforme SPEC |
| `professionals` | conforme SPEC |
| `professional_schedules` | conforme SPEC |
| `professional_procedures` | **fora da SPEC** — chave composta, sem `id` |
| `procedures` | conforme SPEC |
| `procedure_insurance_prices` | **fora da SPEC** — preço e duração por convênio/plano |
| `insurance_companies` | usa `registration_code` e `average_payment_days` |
| `insurance_plans` | conforme SPEC |
| `patients` | conforme SPEC |
| `appointments` | tem `insurance_plan_id`, `cancelled_at`, `idempotency_key` a mais |
| `calendar_blocks` | conforme SPEC |
| `financial_transactions` | tem `supplier`, `recurring`, `notes` a mais |
| `integration_tokens` | **fora da SPEC** — tokens por clínica para n8n/Chatwoot/IA |
| `audit_logs` | conforme SPEC |

### Enums

```
appointments.care_type          private | insurance
appointments.status             scheduled | confirmed | completed | cancelled | no_show
appointments.source             reception | whatsapp | ai_agent | booking_link | professional | import
clinic_members.role             admin | reception | professional | finance
clinic_members.status           active | invited | inactive
financial_transactions.type     income | expense
financial_transactions.status   pending | paid | partial | overdue | cancelled
financial_transactions.method   cash | pix | debit_card | credit_card | bank_slip | insurance | other
```

Atenção a dois pontos que divergem da SPEC e já causaram ajuste no código:

- o status de atendimento realizado é **`completed`**, não `attended`
- existe o papel **`finance`**, além dos três da SPEC

`financial_transactions.amount` é sempre **positivo**; o sinal vem de `type`.
A interface é que inverte o valor das despesas na exibição.

## Dados existentes

Uma clínica de demonstração já populada:

```
clinics                 1   Clínica Sorriso (America/Sao_Paulo)
professionals           3
patients                5
procedures              6
insurance_companies     3
appointments            2
financial_transactions  3
clinic_members          0   ← vazio
profiles                0   ← vazio
```

## Vincular um usuário

`clinic_members` está vazio, então ninguém consegue entrar no app ainda.
Crie o usuário em *Authentication → Users* no Studio e vincule pelo SQL Editor:

```sql
insert into clinic_members (clinic_id, user_id, role)
select '00000000-0000-0000-0000-0000000c1171', id, 'admin'
from auth.users
where email = 'seu-email@dominio.com'
on conflict (clinic_id, user_id) do update set role = 'admin';
```

Confirme também que existe a linha correspondente em `profiles` — o app usa
`profiles.full_name` para exibir o nome no cabeçalho:

```sql
insert into profiles (id, full_name)
select id, 'Seu Nome'
from auth.users
where email = 'seu-email@dominio.com'
on conflict (id) do nothing;
```

## Inspecionar o schema sem acesso ao Postgres

O PostgREST expõe a estrutura via OpenAPI:

```bash
curl -s -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Accept: application/openapi+json" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" | jq '.definitions | keys'
```
