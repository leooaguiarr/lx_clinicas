# Banco de dados — Lx Clínicas

Supabase self-hosted (Coolify, projeto **"Banco de Dados - APPWEB"**). Reaproveitado
da instância do Lx Lava Rápido, que foi descontinuado.

> ⚠️ **Não tocar** no projeto `chatwoot - secretaria` do Coolify. Todo o trabalho é
> exclusivamente no projeto `Banco de Dados - APPWEB`.

## Estrutura

- `migrations/` — schema versionado, aplicado em ordem numérica:
  - `0001_init.sql` — extensões, enums canônicos (inglês) e função `set_updated_at`
  - `0002_core.sql` — `clinics`, `profiles`, `clinic_members`
  - `0003_catalog.sql` — profissionais, procedimentos, convênios, planos, preços por convênio, horários
  - `0004_scheduling.sql` — `patients`, `calendar_blocks`, `appointments` (com trava de conflito de horário)
  - `0005_financial.sql` — `financial_transactions`
  - `0006_integrations_audit.sql` — `integration_tokens`, `audit_logs`
  - `0007_rls.sql` — funções auxiliares e policies de RLS multiempresa
- `seed.sql` — dados de exemplo em PT-BR (uma clínica), espelhando os mocks do frontend

Valores são canônicos em inglês no banco (ex.: `care_type = 'private'`); a interface
PT-BR traduz na exibição. Isso mantém a API consumida pelo n8n estável.

## Antes de aplicar: BACKUP (obrigatório)

O reset do schema é irreversível. Faça um backup do banco atual **antes**:

- **Opção recomendada:** usar o backup nativo do Coolify no recurso Postgres do
  projeto `Banco de Dados - APPWEB` (Coolify → recurso do banco → Backups → executar).
- **Alternativa:** `pg_dump` rodando dentro do container do Postgres (terminal do
  Coolify), gerando um arquivo `.sql` guardado fora do servidor.

## Reset e aplicação

Depois do backup, o processo é:

1. Dropar o schema antigo do Lava Rápido (as tabelas em `public` + limpar `auth.users`).
2. Aplicar `migrations/0001` … `0007` em ordem.
3. (Opcional) Aplicar `seed.sql` para dados de demonstração.

A `DATABASE_URL` fica em `.env.local` (fora do controle de versão):

```
DATABASE_URL=postgresql://usuario:senha@host:porta/postgres
```

> A senha nunca é colada em chat nem commitada. O `.env.local` já está no `.gitignore`.

Primeiro rodamos tudo dentro de uma transação com `ROLLBACK` para conferir que
aplica sem erro; só depois aplicamos de verdade.
