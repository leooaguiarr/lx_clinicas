# CONTINUIDADE — Lx Clínicas

> **Propósito:** retomar o trabalho em qualquer computador ou com qualquer agente de IA.
> **Regra:** este arquivo DEVE ser atualizado antes de todo `git push` (o hook em `.githooks/pre-push` bloqueia o push se ele não tiver sido tocado).
>
> **Última atualização:** 2026-07-23 · workflows n8n publicados; prompt do agente reescrito (falta colar)

---

## 1. O que é o projeto

MVP de gestão para clínicas odontológicas (SPEC completa em `SPEC-LX-CLINICAS-MVP.md`).
Diferencial: agenda operável por agente de IA via WhatsApp (n8n + Chatwoot + Lexion).

| Item | Valor |
| --- | --- |
| Repositório | https://github.com/leooaguiarr/lx_clinicas (**privado**) |
| App em produção | https://lx-clinicas.vercel.app |
| Projeto Vercel | `leonardo-aguiars-projects/lx-clinicas` (deploy: `npx vercel deploy --prod --yes`) |
| Supabase (self-hosted, Coolify) | https://supabase.lexionconsultoria.tech |
| Clínica de demonstração | Clínica Sorriso — `clinic_id: 00000000-0000-0000-0000-0000000c1171` |
| Stack | Next.js 16 (App Router) · React 19 · TS · Tailwind · Zod · Supabase (@supabase/ssr) |

## 2. Estado atual — o que JÁ está pronto

- ✅ **Frontend conectado ao Supabase** (nada de mock): agenda semanal, pacientes (lista/perfil/cadastro), financeiro, relatórios, configurações
- ✅ **Auth real** (Supabase Auth por senha) + proxy protegendo o dashboard (`src/proxy.ts`)
- ✅ **Multiempresa**: clínica ativa via `clinic_members`; papéis `admin | reception | professional | finance`; RLS ativa no banco
- ✅ **API de integração `/api/v1`** para n8n/Chatwoot/agente de IA — endpoints, regras e exemplos em `docs/API.md`
- ✅ **Tokens por clínica** (`integration_tokens`, SHA-256): gerar/revogar em `/configuracoes/integracoes` (só admin)
- ✅ **Deploy no Vercel** com as 3 env vars configuradas (Production + Preview)
- ✅ Testes manuais da API contra o banco real: conflito 409, idempotência, remarcação, cancelamento, fuso

## 3. Decisões e pegadinhas (NÃO redescobrir do zero)

1. **O schema do banco JÁ EXISTE na instância** (16 tabelas) e **não é versionado aqui** — detalhes em `supabase/README.md`. NÃO criar migrations a partir da SPEC: o schema real diverge dela.
2. Enums reais ≠ SPEC: status de atendimento é **`completed`** (não `attended`); existe papel **`finance`**; formas de pagamento `debit_card/credit_card/bank_slip`.
3. **Telefones**: `patients.normalized_phone` em E.164 **com `+`** (`+5535999128432`). Usar `normalizePhone()` de `src/lib/domain.ts`.
4. **IDs de demonstração** não passam em `z.string().uuid()` (RFC estrita) — usar `uuidSchema` de `src/lib/validation.ts`.
5. `clinic_members` **não tem FK para `profiles`** — join via PostgREST falha (PGRST200); buscar profiles em query separada.
6. Banco em UTC; exibição no fuso da clínica via `src/lib/dates.ts`. Na API, aceitar `date`+`time` (fuso da clínica) ou ISO com offset; ISO sem fuso é rejeitado.
7. `financial_transactions.amount` é sempre positivo; o sinal vem de `type` (`income|expense`).
8. Next 16: `src/middleware.ts` foi renomeado para `src/proxy.ts` (convenção nova). O matcher EXCLUI `/api` (a API autentica por token próprio).
9. `professional_schedules` foi populada por nós (seg–sex 08:00–18:00, 30 min, 3 profissionais) — ajustar quando a clínica definir horários reais.

## 4. Configurar um computador novo

```bash
git clone <url-do-repo> && cd lx_clinicas
npm install        # também configura o hook de pre-push (script "prepare")
cp .env.example .env.local
```

Preencher `.env.local` (valores NUNCA vão para o git):
- `NEXT_PUBLIC_SUPABASE_URL` = `https://supabase.lexionconsultoria.tech`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` = no Coolify (serviço Supabase → Environment Variables, variáveis `SERVICE_SUPABASEANON_KEY` / `SERVICE_SUPABASESERVICE_KEY`) ou no Studio (Settings → API Keys)

```bash
npm run dev        # http://localhost:3000
```

Login: usuário criado no Supabase Auth + vínculo em `clinic_members` (SQL em `supabase/README.md`).

## 4.1 Integração n8n (estado em 2026-07-23)

Instância: `https://n8nai.lexionconsultoria.tech` · pasta **Secretaria_testes** · projeto pessoal `61MxE7VS91FQbpKS`.

O agente "Sofia" (Chatwoot + WhatsApp + memória Postgres + ElevenLabs) apontava para
outro backend — uma Edge Function `porteiro` no Supabase Cloud (projeto `hlkhxukpdbniwuimlzjs`),
chamada de "Sofia Scheduling", em estilo RPC (`{operacao: "..."}`). **Nunca chegou a funcionar**:
os nodes estavam sem credencial anexada.

Workflows repontados para `https://lx-clinicas.vercel.app/api/v1` (REST):

| Workflow | ID | Mudança |
| --- | --- | --- |
| 01. Secretária teste | `ZMrUYS9fHNSJor52` | tools Cancelar/Buscar agendamentos → REST; nova tool `Buscar catalogo da clinica`; mapeamentos dos sub-workflows |
| 03. Buscar janelas (API) | `vhtIWFpNNYG6KWvM` | `GET /availability`; `Split Out` → Code `Formatar janelas` (resposta é aninhada) |
| 04. Criar agendamento (API) | `PeHuXTZLKim7d1w6` | `POST /appointments` + header `Idempotency-Key` |
| 04.1 Atualizar agendamento (API) | `fef9s3t94RQ5OAnu` | `PATCH /appointments/:id` |
| 09. Desmarcar e enviar alerta (API) | `aOlH971vjIHrOJMt` | `DELETE /appointments/:id?reason=` |

Decisões:
- **Profissional nunca fixo** — a clínica pode ter vários. O agente consulta `GET /catalog`,
  e `availability` sem `professional_id` devolve todos. Os `X-Profissional-Id` hardcoded foram removidos.
- Vocabulário pt-BR mantido nas entradas dos sub-workflows (`profissional_id`, `procedimento_id`),
  traduzido para o inglês da API dentro do node HTTP.

Token criado: `n8n` (prefixo `lxc_kfBCRgaZ`), 5 escopos. Credencial n8n: **"lx clinica"**
(`auZEd6fQMyzZjav7`, tipo Header Auth), anexada manualmente aos 7 nodes HTTP.

> O MCP do n8n **não expõe credenciais** na leitura (nodes com credencial aparecem sem a chave
> `credentials`) e **não consegue anexá-las** para auth genérica — `setNodeCredential` recusa
> `httpHeaderAuth`. Anexar credencial nesses workflows é sempre manual, pela UI.

### Limpeza aplicada no workflow 01 (2026-07-23)

Tudo **desabilitado, nada removido**.

- **Voz desligada, transcrição mantida**: `Calcular tipo da resposta` foi travado em `'texto'`
  (lógica original preservada em comentário dentro do node), e os nodes `Formatar SSML`,
  `Gravando...`, `Gerar áudio` e `Enviar áudio` estão disabled. O caminho de entrada
  (`Download áudio → Extract from File → Convert to File → Transcrever audio`) continua ativo.
- **Tools desabilitadas**: `Listar arquivos`, `Enviar arquivo` (Drive, fora do escopo do MVP),
  `Enviar alerta de cancelamento` (`id_conversa_alerta` vazio no Info — falharia),
  `Reagir mensagem` (cosmético), `Preferencia audio texto` (sem efeito sem voz).
- **Tools ativas**: Buscar catalogo da clinica · Buscar janelas disponiveis · Criar agendamento ·
  Atualizar agendamento · Cancelar agendamento · Buscar agendamentos do contato ·
  Escalar humano · Refletir.

**Pendências desta integração:**
1. Executar o workflow 03 manualmente (`data = YYYY-MM-DD`) para validar token + credencial ponta a ponta.
   Confirmar depois que `integration_tokens.last_used_at` deixou de ser `null`.
2. **Prompt do agente reescrito** e versionado em `docs/prompt-agente-secretaria.md`
   (o anterior ficou em `docs/prompt-agente-secretaria.ANTERIOR.md`). **Falta colar no n8n**:
   workflow 01 → node `Secretária v3` → Options → System Message → substituir tudo →
   salvar → publicar. O MCP exige enviar os 33k caracteres inline numa única chamada,
   por isso essa etapa ficou manual.
3. O node `Info` do workflow 01 ainda tem `profissional_id` e `tipo_consulta_id` hardcoded do
   Sofia Scheduling — **não são mais usados**, mas convém limpar (não removi para não arriscar
   as outras 17 atribuições do node).
4. **Reativar depois que o núcleo estiver funcionando** (decidido com o cliente):
   - `11. Agente de Lembretes de Agendamento` — precisa ser **migrado para a API do Lx Clínicas** antes
     (hoje ainda lê do Google Calendar / backend antigo);
   - `02. Baixar e enviar arquivo do Google Drive` — junto com as tools `Listar arquivos` e `Enviar arquivo`.
5. Avisos de validação pré-existentes (não introduzidos por nós) nos nodes `Buscar mensagens`,
   `Verificar status atendimento` (Postgres) e `Listar arquivos` (Drive).

## 5. Próximos passos (ordem sugerida)

1. **Finalizar n8n**: token + credencial + publicar + reescrever o system message (ver 4.1)
2. CRUD nas telas de configurações (profissionais, procedimentos, convênios, usuários — hoje só listam)
3. Ações de agendamento na UI da agenda (confirmar/cancelar/remarcar clicando no card)
4. Financeiro: criar movimentação pela UI (botão existe, não faz nada)
5. Perfil do paciente: abas Financeiro/Documentos/Histórico (Storage pendente)
6. Rotacionar as chaves demo do Supabase (validade de 100 anos) antes de clínica real
7. Rate limit na API `/api/v1` (spec, seção 18)

## 6. Histórico resumido

| Data | O que foi feito |
| --- | --- |
| 2026-07-23 | Frontend navegável (mock) → conexão real com Supabase → deploy Vercel → API /api/v1 + tokens de integração |
