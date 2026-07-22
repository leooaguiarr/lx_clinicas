# Lx Clinicas — Ponto de Continuidade

> Atualizado em 22/07/2026. Leia isto antes de continuar o desenvolvimento.

## Estado atual

### Frontend (branch `polimento-frontend`)
- **MVP funcional com dados mock** — Next.js 16, React 19, TypeScript, Tailwind CSS
- Agenda com navegação de semanas funcional (baseada em `src/lib/dates.ts`, data mock = 21/07/2026)
- Pacientes com busca, filtro por tipo, paginação (8 por página)
- Perfil do paciente com 5 abas funcionais (Resumo/Agendamentos/Financeiro/Documentos/Histórico)
- Financeiro com filtro de status funcional e gráfico de barras
- Drawer de novo agendamento com formulário e validação Zod
- Login é apenas visual (sem auth real ainda)

### Banco de dados (Supabase self-hosted no Coolify)
- **Schema aplicado e rodando** no projeto "Banco de Dados - APPWEB" do Coolify
- 16 tabelas criadas, RLS habilitado em todas, policies multiempresa ativas
- Seed aplicado: 1 clínica ("Clínica Sorriso"), 3 profissionais, 3 convênios, 6 procedimentos, 5 pacientes, 2 agendamentos, 3 transações financeiras
- Backup do banco anterior (Lava Rápido) em `/tmp/backup_lava_rapido_20260722.sql` no container do Postgres
- **Constraint de exclusão** (`btree_gist`) impedindo sobreposição de horários por profissional
- **Idempotency key** para criação de agendamentos via n8n

### Infraestrutura Coolify
- **"Banco de Dados - APPWEB"** → nosso projeto. Supabase (Kong + Studio + Postgres + Auth + Storage)
- **"chatwoot - secretaria"** → NÃO TOCAR. Projeto separado do Chatwoot da secretária.
- Kong gateway: `https://supabase.lexionconsultoria.tech:8000` (Running/healthy)
- Supabase Studio: rodando (acessar pelo Coolify para ver o SQL Editor)

## Arquivos importantes

| Arquivo | Descrição |
|---------|-----------|
| `SPEC-LX-CLINICAS-MVP.md` | Especificação completa do MVP (27 seções) |
| `PROMPT-INICIAL-CODEX.md` | Prompt original que gerou o frontend |
| `supabase/migrations/0001-0007` | Schema versionado (enums, tabelas, RLS) |
| `supabase/seed.sql` | Dados de exemplo da Clínica Sorriso |
| `supabase/deploy.sql` | Script consolidado usado para aplicar (reset + schema + seed) |
| `supabase/README.md` | Documentação do banco e instruções de backup |
| `src/lib/dates.ts` | Utilitários de data da agenda (MOCK_TODAY, startOfWeek, etc.) |
| `src/lib/mock-data.ts` | Dados mock do frontend (12 pacientes, appointments com ISO date) |

## Decisões de modelagem

- Enums em **inglês** no banco (`care_type = 'private'`), interface PT-BR traduz na exibição
- Multiempresa com `clinic_id` em todas as tabelas + RLS
- `integration_tokens` guarda **hash** do token, nunca o token puro
- Telefone normalizado em **E.164** (`+5535999999999`), com `phone_display` para exibição
- Papéis: `admin`, `reception`, `professional`, `finance`
- Financeiro restrito a admin + finance; tokens de integração restrito a admin

## Próximos passos (em ordem sugerida)

1. **Conectar frontend ao Supabase** — instalar `@supabase/supabase-js`, configurar client com env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY), criar API routes
2. **Auth real** — login com Supabase Auth (email/senha), criar profile + clinic_member no signup, proteger rotas
3. **Substituir mock-data por queries reais** — agenda, pacientes, financeiro buscando do banco
4. **CRUD completo** — criar/editar/excluir pacientes, agendamentos, transações
5. **Integração n8n** — reapontar workflows de agendamento automático para o novo schema
6. **UI/UX refinamentos** — após o backend funcional, polir visual e experiência

## Credenciais e segurança

- A `DATABASE_URL` e chaves do Supabase devem estar em `.env.local` (já no `.gitignore`)
- **Nunca** colar senhas no chat ou commitar
- Para encontrar as credenciais: Coolify → "Banco de Dados - APPWEB" → supabase → General → campos de PostgreSQL Password, etc.
- Supabase anon key e service_role key: verificar nas Environment Variables do Kong no Coolify

## Como rodar localmente

```bash
npm install
npm run dev
# Abre em http://localhost:3000
```

O sistema roda 100% com dados mock por enquanto. Para conectar ao banco real, será necessário configurar o `.env.local` com as variáveis do Supabase.
