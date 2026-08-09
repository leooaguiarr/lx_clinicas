# CONTINUIDADE — Lx Clínicas

> **Propósito:** retomar o trabalho em qualquer computador ou com qualquer agente de IA.
> **Regra:** este arquivo DEVE ser atualizado antes de todo `git push` (o hook em `.githooks/pre-push` bloqueia o push se ele não tiver sido tocado).
>
> **Última atualização:** 2026-08-09 · menu lateral colapsável no desktop

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
- ✅ **Agente de IA (n8n + Chatwoot + WhatsApp) agendando de verdade** — validado em 23/07 às 21h42:
  paciente criado automaticamente pelo telefone, consulta gravada com `source: ai_agent`,
  auditoria registrada. Ver seção 4.1.
- ✅ **Log de erros no servidor** (`src/lib/logger.ts`): uma linha JSON por evento nos logs da
  Vercel, em todas as rotas `/api/v1` e server actions. As mensagens devolvidas continuam
  genéricas; o motivo real deixou de se perder.
- ✅ **Agenda com grade dinâmica**: as horas exibidas vêm de `professional_schedules` e se
  esticam para cobrir qualquer agendamento fora do expediente; sábado/domingo aparecem quando
  há expediente ou algo marcado; atendimentos simultâneos ficam lado a lado.

## 3. Decisões e pegadinhas (NÃO redescobrir do zero)

1. **O schema do banco JÁ EXISTE na instância** (16 tabelas) e **não é versionado aqui** — detalhes em `supabase/README.md`. NÃO criar migrations a partir da SPEC: o schema real diverge dela.
2. Enums reais ≠ SPEC: status de atendimento é **`completed`** (não `attended`); existe papel **`finance`**; formas de pagamento `debit_card/credit_card/bank_slip`.
3. **Telefones**: `patients.normalized_phone` em E.164 **com `+`** (`+5535999128432`). Usar `normalizePhone()` de `src/lib/domain.ts`.
4. **IDs de demonstração** não passam em `z.string().uuid()` (RFC estrita) — usar `uuidSchema` de `src/lib/validation.ts`.
5. `clinic_members` **não tem FK para `profiles`** — join via PostgREST falha (PGRST200); buscar profiles em query separada.
6. Banco em UTC; exibição no fuso da clínica via `src/lib/dates.ts`. Na API, aceitar `date`+`time` (fuso da clínica) ou ISO com offset; ISO sem fuso é rejeitado.
7. `financial_transactions.amount` é sempre positivo; o sinal vem de `type` (`income|expense`).
8. Next 16: `src/middleware.ts` foi renomeado para `src/proxy.ts` (convenção nova). O matcher EXCLUI `/api` (a API autentica por token próprio).
9. `professional_schedules` foi populada por nós (seg–sex 08:00–18:00, 30 min, 3 profissionais) — ajustar quando a clínica definir horários reais. A agenda **lê essa tabela** para montar a grade: mudar os horários lá muda o que a tela mostra.
10. A grade da agenda tem linhas de 30 min, mas os cards são posicionados **por minuto** (`startMinutes`), então um horário quebrado como 08:20 aparece no lugar certo. A lógica pura está em `src/lib/agenda-layout.ts`, separada das queries justamente para ser testável.
11. `GET /availability` agora responde **500 se qualquer uma das consultas falhar**. É proposital: devolver a lista parcial fazia o agente oferecer horário já ocupado.

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

### Prompt do agente

Versionado em `docs/prompt-agente-secretaria.md` (v2, ~35k chars). O anterior ficou em
`docs/prompt-agente-secretaria.ANTERIOR.md`.

> **A colagem no n8n é manual**: o MCP exige enviar os 35k caracteres inline numa única
> chamada. Caminho: workflow 01 → node `Secretária v3` → Options → System Message →
> substituir tudo → salvar → **publicar**.

Duas correções que valem lembrar:
- O prompt **não lista os dentistas** — manda consultar `Buscar_catalogo_da_clinica`.
  É o que faz o mesmo prompt servir para qualquer clínica.
- A v1 fazia o agente **não se apresentar**: `"boa noite"` estava listado como sinal de
  *despedida* na REGRA #2. A v2 acrescenta a REGRA #0 (apresentação obrigatória na primeira
  mensagem) e ensina a desambiguar saudação × despedida pelo contexto.

### Estado: FUNCIONANDO ✅

Validado em 23/07/2026 21h42 por mensagem real no WhatsApp: o agente consultou a agenda,
criou o paciente pelo telefone e gravou a consulta com `source: ai_agent`, deixando rastro
em `audit_logs` (`patient.created` seguido de `appointment.created`).

**Pendências desta integração:**
1. O agente gravou o agendamento **sem `procedure_id`** (o join `procedures` veio null).
   Vale reforçar no prompt que ele pergunte o procedimento e passe o ID do catálogo —
   é o que define a duração correta da consulta.
2. O node `Info` do workflow 01 ainda tem `profissional_id` e `tipo_consulta_id` hardcoded
   do Sofia Scheduling — **não são mais usados**, mas convém limpar (não removidos para não
   arriscar as outras 17 atribuições do node).
3. **Reativar depois** (decidido com o cliente):
   - `11. Agente de Lembretes de Agendamento` — precisa ser **migrado para a API do Lx Clínicas**
     antes de ligar (hoje ainda lê do Google Calendar / backend antigo);
   - `02. Baixar e enviar arquivo do Google Drive` — junto com as tools `Listar arquivos`
     e `Enviar arquivo`.
4. Avisos de validação pré-existentes (não introduzidos por nós) nos nodes `Buscar mensagens`
   e `Verificar status atendimento` (Postgres) e `Listar arquivos` (Drive).


## 5. Próximos passos (ordem sugerida)

A ordem prioriza **confiabilidade do que já está no ar** antes de superfície nova — há um
agente autônomo escrevendo no banco em produção.

1. **Ações de agendamento na UI da agenda** (confirmar/cancelar/remarcar clicando no card).
   `updateAppointmentStatus` em `src/lib/actions/appointments.ts` já existe, mas está **sem uso
   e sem validação** (recebe `string` e faz `status as never`) — tipar com `z.enum` ao ligar.
2. **Testes das funções puras**: `zonedDateTime`, `weekOf`, `resolveInstant`, `normalizePhone`
   e `src/lib/agenda-layout.ts`. Não há infra de teste no projeto ainda.
3. Ajustar o prompt para o agente informar o **procedimento** ao agendar (ver 4.1, pendência 1)
4. CRUD nas telas de configurações (profissionais, procedimentos, convênios, usuários — hoje só listam)
5. Financeiro: criar movimentação pela UI (botão existe, não faz nada)
6. Perfil do paciente: abas Financeiro/Documentos/Histórico (Storage pendente)
7. Rotacionar as chaves demo do Supabase (validade de 100 anos) antes de clínica real
8. Rate limit na API `/api/v1` (spec, seção 18)

### Dívidas conhecidas (revisão de 07/08)

- **Papéis não são checados nas escritas**: `createPatient` e `createAppointment` só chamam
  `requireSession()`. `updateClinic` e os tokens checam `admin`. A RLS pode cobrir — falta
  confirmar as policies e alinhar os dois casos.
- `normalizePhone` prefixa `+55` em qualquer entrada com até 11 dígitos: um telefone sem DDD
  vira E.164 inválido e cria paciente duplicado. Falta exigir 10 ou 11 dígitos.
- `authenticateRequest` grava `last_used_at` a **cada** request — uma escrita por chamada do
  agente. Vale só atualizar se o último uso for mais velho que alguns minutos.
- `DEFAULT_SCOPES` concede os 5 escopos sempre; a UI não permite escolher.
- `tsconfig.tsbuildinfo` está rastreado no git e deveria estar no `.gitignore`.

## 6. Histórico resumido

| Data | O que foi feito |
| --- | --- |
| 2026-07-23 | Frontend navegável (mock) → conexão real com Supabase → deploy Vercel → API /api/v1 + tokens de integração → repositório privado no GitHub → workflows n8n migrados do backend antigo → prompt reescrito → **agente agendando pelo WhatsApp** |
| 2026-08-07 | Revisão do código: log de erros no servidor (antes não havia nenhum) e correção da agenda, que escondia sem aviso os atendimentos fora de 08:00–18:00/seg–sex e empilhava cards simultâneos um sobre o outro |
| 2026-08-09 | Ajuste no `app-shell`: botão de menu agora funciona no desktop, permitindo ocultar a barra lateral e usar a largura total da tela. |
