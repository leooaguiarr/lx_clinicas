# Lx Clínicas — Especificação do MVP

## 1. Visão do produto

O **Lx Clínicas** será um appweb de gestão para clínicas, com foco inicial em clínicas odontológicas.

O produto deve ser simples, rápido e prático para uso diário por recepcionistas, profissionais e gestores. O diferencial principal será a integração entre:

- Agenda da clínica
- Cadastro de pacientes
- WhatsApp
- Chatwoot
- n8n
- Agente de IA da Lexion
- Financeiro básico
- Supabase self-hosted

O sistema não deve tentar competir, no MVP, com plataformas odontológicas completas. A prioridade é resolver a operação da recepção, reduzir perda de leads e automatizar agendamentos.

---

## 2. Proposta de valor

> Organizar a agenda, centralizar os pacientes e permitir que o agente de IA da Lexion consulte horários, realize agendamentos, confirmações, reagendamentos e cancelamentos diretamente pelo WhatsApp.

### Diferenciais

- Agenda preparada para automação
- Integração com n8n e Chatwoot
- Identificação de agendamentos realizados pela IA
- Interface simples e moderna
- Controle de atendimentos particulares e convênios
- Implantação personalizada para cada clínica
- Estrutura multiempresa desde o início
- Banco de dados próprio em Supabase self-hosted

---

## 3. Objetivos do MVP

O MVP deve permitir que uma clínica consiga:

1. Cadastrar profissionais
2. Cadastrar pacientes
3. Cadastrar procedimentos
4. Cadastrar convênios
5. Configurar horários de atendimento
6. Criar e gerenciar agendamentos
7. Separar visualmente particular e convênio
8. Evitar conflito de horário
9. Consultar disponibilidade pela API
10. Permitir que o agente de IA faça agendamentos
11. Registrar receitas e despesas básicas
12. Gerenciar usuários e permissões
13. Consultar relatórios operacionais básicos

---

## 4. Fora do escopo do MVP

Não implementar inicialmente:

- Odontograma
- Prontuário eletrônico completo
- Assinatura digital
- Prescrição digital
- TISS
- Integração direta com operadoras
- Emissão de nota fiscal
- Estoque
- Controle complexo de comissões
- Aplicativo mobile nativo
- Telemedicina
- Pagamento online
- Portal completo do paciente
- Integração bancária
- Conciliação financeira
- BI avançado
- IA clínica
- Reconhecimento de voz
- Controle avançado de próteses

---

# 5. Perfis de usuário

## 5.1 Administrador

Pode:

- Acessar todas as áreas
- Gerenciar usuários
- Alterar configurações
- Visualizar financeiro
- Gerenciar integrações
- Visualizar relatórios
- Cadastrar profissionais, procedimentos e convênios

## 5.2 Recepção

Pode:

- Acessar agenda
- Criar e editar agendamentos
- Cadastrar pacientes
- Atualizar dados administrativos
- Confirmar, cancelar e reagendar
- Registrar pagamentos
- Visualizar pendências financeiras

Não pode:

- Alterar configurações sensíveis
- Gerenciar usuários administradores
- Acessar segredos de integração

## 5.3 Profissional

Pode:

- Visualizar a própria agenda
- Consultar pacientes relacionados aos seus atendimentos
- Registrar observações de atendimento
- Alterar status do atendimento

Não pode:

- Visualizar o financeiro geral
- Alterar configurações da clínica
- Visualizar dados de outros profissionais sem autorização

## 5.4 Financeiro

Pode:

- Visualizar receitas
- Visualizar despesas
- Registrar pagamentos
- Consultar relatórios financeiros

Não pode:

- Alterar dados clínicos
- Gerenciar agenda, salvo permissão adicional

---

# 6. Navegação principal

Menu lateral do MVP:

- Agenda
- Pacientes
- Financeiro
- Relatórios
- Configurações

Submenu de configurações:

- Clínica
- Profissionais
- Procedimentos
- Convênios
- Usuários
- Integrações

---

# 7. Tela principal: Agenda

A agenda será a página inicial após o login.

## 7.1 Visualizações

- Dia
- Semana
- Lista
- Por profissional
- Todos os profissionais
- Particular
- Convênio

A visualização mensal não é prioridade no MVP.

## 7.2 Filtros

- Profissional
- Tipo de atendimento
- Convênio
- Procedimento
- Status
- Unidade futura
- Data

## 7.3 Ações

- Criar agendamento
- Editar agendamento
- Reagendar
- Confirmar
- Cancelar
- Marcar falta
- Marcar como atendido
- Bloquear horário
- Registrar pagamento
- Abrir cadastro do paciente
- Abrir conversa no Chatwoot

## 7.4 Status do agendamento

Status principais do MVP:

- `scheduled`
- `confirmed`
- `completed`
- `cancelled`
- `no_show`

Status futuros:

- `waiting_confirmation`
- `patient_arrived`
- `in_service`
- `rescheduled`

## 7.5 Particular e convênio

Não criar duas tabelas ou dois calendários separados.

Usar uma única tabela de agendamentos com o campo:

```ts
type CareType = "private" | "insurance";
```

A interface terá abas ou filtros:

- Todos
- Particular
- Convênio

## 7.6 Informações do agendamento

- Paciente
- Telefone
- Profissional
- Procedimento
- Tipo de atendimento
- Convênio
- Plano
- Data
- Hora inicial
- Hora final
- Valor previsto
- Valor recebido
- Status
- Origem
- Observação administrativa
- Responsável pela criação
- ID do contato no Chatwoot
- ID da conversa no Chatwoot

## 7.7 Origem do agendamento

```ts
type AppointmentSource =
  | "reception"
  | "whatsapp"
  | "ai_agent"
  | "booking_link"
  | "professional"
  | "import";
```

## 7.8 Regras de negócio

- Não permitir dois agendamentos para o mesmo profissional no mesmo intervalo
- Bloqueios de agenda devem impedir novos agendamentos
- Horários fora da disponibilidade do profissional devem ser rejeitados
- O horário deve ser validado novamente no momento da confirmação
- Agendamentos via n8n devem usar chave de idempotência
- O sistema deve registrar quem criou e quem alterou o agendamento
- Cancelamentos devem guardar motivo e data
- Reagendamentos devem guardar referência do agendamento anterior
- Paciente pode ter vários agendamentos futuros
- Um profissional pode atender particular e convênio
- Um procedimento pode ter valores diferentes por convênio

---

# 8. Cadastro de pacientes

## 8.1 Listagem

Colunas:

- Nome
- Telefone
- Última consulta
- Próxima consulta
- Profissional principal
- Particular ou convênio
- Convênio
- Saldo pendente
- Status

## 8.2 Busca

Buscar por:

- Nome
- Telefone
- CPF
- E-mail
- Número da carteirinha

## 8.3 Cadastro

Campos:

- Nome completo
- Telefone
- Telefone normalizado
- Data de nascimento
- CPF opcional
- E-mail opcional
- Sexo ou gênero opcional
- Convênio
- Plano
- Número da carteirinha
- Validade da carteirinha
- Profissional principal
- Observações administrativas
- Consentimento de comunicação
- Origem do paciente
- Data de cadastro

## 8.4 Normalização de telefone

Exemplo:

```text
Entrada: (35) 9 9999-9999
Salvo:   +5535999999999
```

Criar unicidade por clínica:

```text
clinic_id + normalized_phone
```

## 8.5 Perfil do paciente

Abas:

- Resumo
- Agendamentos
- Financeiro
- Documentos
- Histórico

Resumo:

- Dados pessoais
- Próxima consulta
- Última consulta
- Total de consultas
- Cancelamentos
- Faltas
- Pendências financeiras
- Botão para abrir WhatsApp
- Botão para criar agendamento

---

# 9. Registro de atendimento no MVP

Não utilizar o termo “prontuário eletrônico completo” no MVP.

Disponibilizar apenas:

- Histórico de agendamentos
- Procedimentos realizados
- Observação simples do atendimento
- Anexos
- Registro de data, hora e autor
- Histórico de alterações administrativas

Módulos futuros:

- Anamnese
- Odontograma
- Plano de tratamento
- Evolução clínica
- Prescrição
- Atestado
- Assinatura digital
- Consentimentos
- Auditoria clínica avançada

---

# 10. Financeiro básico

## 10.1 Dashboard

Cards:

- Recebido hoje
- Recebido no mês
- A receber
- Despesas do mês
- Saldo
- Inadimplência

## 10.2 Receitas

Campos:

- Paciente
- Agendamento
- Procedimento
- Profissional
- Tipo de atendimento
- Convênio
- Valor previsto
- Valor recebido
- Data de vencimento
- Data de pagamento
- Forma de pagamento
- Status

## 10.3 Despesas

Campos:

- Descrição
- Categoria
- Valor
- Data
- Fornecedor opcional
- Recorrente
- Observação
- Status

## 10.4 Formas de pagamento

```ts
type PaymentMethod =
  | "cash"
  | "pix"
  | "debit_card"
  | "credit_card"
  | "bank_slip"
  | "insurance"
  | "other";
```

## 10.5 Status financeiro

```ts
type FinancialStatus =
  | "pending"
  | "paid"
  | "partial"
  | "overdue"
  | "cancelled";
```

---

# 11. Convênios

Cadastro de convênio:

- Nome
- Registro opcional
- Ativo ou inativo
- Prazo médio de recebimento
- Observações

Planos:

- Nome do plano
- Convênio
- Ativo ou inativo

Procedimentos por convênio:

- Procedimento
- Convênio
- Plano opcional
- Valor
- Duração
- Necessita autorização
- Código interno opcional

Atendimento por convênio:

- Número da carteirinha
- Validade
- Número de autorização
- Status da guia
- Valor previsto
- Valor recebido

Não implementar TISS no MVP.

---

# 12. Configurações da clínica

## 12.1 Dados da clínica

- Nome fantasia
- Razão social
- CPF ou CNPJ
- Telefone
- WhatsApp
- E-mail
- Endereço
- Logo
- Especialidade principal
- Fuso horário
- Duração padrão de consulta
- Horário de funcionamento

## 12.2 Profissionais

- Nome
- Especialidade
- Conselho
- Número do conselho
- Telefone
- E-mail
- Cor da agenda
- Horários de atendimento
- Intervalos
- Procedimentos
- Convênios
- Status

## 12.3 Procedimentos

- Nome
- Categoria
- Duração padrão
- Valor particular
- Profissionais autorizados
- Ativo ou inativo

## 12.4 Usuários

- Nome
- E-mail
- Função
- Profissional vinculado opcional
- Status
- Último acesso
- Convite pendente

---

# 13. Integração com Chatwoot, n8n e WhatsApp

## 13.1 Responsabilidade de cada sistema

### Lx Clínicas

Fonte oficial de:

- Pacientes
- Profissionais
- Procedimentos
- Disponibilidade
- Agendamentos
- Convênios
- Financeiro

### Chatwoot

Fonte de:

- Conversas
- Mensagens
- Contatos do atendimento
- Atendimento humano

### n8n

Responsável por:

- Orquestração
- Agente de IA
- Confirmações
- Lembretes
- Reagendamentos
- Cancelamentos
- Integrações

## 13.2 Fluxo

```text
Paciente envia mensagem no WhatsApp
            ↓
         Chatwoot
            ↓
Webhook message_created
            ↓
            n8n
            ↓
      Agente de IA
            ↓
      API Lx Clínicas
            ↓
Consulta ou altera agenda
            ↓
Resposta retorna ao n8n
            ↓
Mensagem enviada pelo Chatwoot
```

## 13.3 Fluxo de agendamento

1. Paciente informa intenção
2. Agente identifica procedimento
3. Agente identifica profissional ou especialidade
4. Agente identifica preferência de data ou período
5. n8n consulta disponibilidade
6. Sistema retorna opções
7. Paciente seleciona
8. n8n envia solicitação de criação
9. Sistema valida o horário novamente
10. Sistema cria o agendamento
11. Sistema retorna confirmação
12. n8n envia mensagem ao paciente
13. Sistema registra origem `ai_agent`

---

# 14. API REST do MVP

Base:

```text
/api/v1
```

## 14.1 Pacientes

```http
GET /api/v1/patients
GET /api/v1/patients/:id
GET /api/v1/patients/lookup?phone=+5535999999999
POST /api/v1/patients
PATCH /api/v1/patients/:id
```

## 14.2 Disponibilidade

```http
GET /api/v1/availability
```

Parâmetros:

- `professional_id`
- `procedure_id`
- `care_type`
- `insurance_id`
- `date_from`
- `date_to`
- `period`
- `timezone`

## 14.3 Agendamentos

```http
GET /api/v1/appointments
GET /api/v1/appointments/:id
POST /api/v1/appointments
PATCH /api/v1/appointments/:id
PATCH /api/v1/appointments/:id/confirm
PATCH /api/v1/appointments/:id/cancel
PATCH /api/v1/appointments/:id/reschedule
PATCH /api/v1/appointments/:id/status
```

## 14.4 Financeiro

```http
GET /api/v1/financial/transactions
POST /api/v1/financial/transactions
PATCH /api/v1/financial/transactions/:id
POST /api/v1/appointments/:id/payment
```

## 14.5 Integrações

```http
POST /api/v1/integrations/chatwoot/webhook
POST /api/v1/integrations/n8n/webhook
```

## 14.6 Cabeçalhos

```http
Authorization: Bearer <integration-token>
X-Clinic-Id: <clinic-id>
Idempotency-Key: <unique-key>
Content-Type: application/json
```

## 14.7 Exemplo de criação via IA

```json
{
  "patient_id": "uuid",
  "professional_id": "uuid",
  "procedure_id": "uuid",
  "care_type": "private",
  "start_at": "2026-07-22T09:00:00-03:00",
  "end_at": "2026-07-22T09:45:00-03:00",
  "source": "ai_agent",
  "chatwoot_contact_id": "123",
  "chatwoot_conversation_id": "456",
  "n8n_execution_id": "789"
}
```

---

# 15. Stack técnica

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query
- FullCalendar
- Lucide Icons

## Backend

- Next.js Route Handlers
- Camada de serviços
- API REST
- Zod
- PostgreSQL
- Supabase Auth
- Supabase Storage

## Infraestrutura

- Supabase self-hosted
- Coolify
- PostgreSQL
- n8n
- Chatwoot
- Redis
- Proxy reverso
- Backups externos

---

# 16. Estrutura inicial do projeto

```text
lx-clinicas/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── agenda/
│   │   ├── pacientes/
│   │   ├── financeiro/
│   │   ├── relatorios/
│   │   └── configuracoes/
│   ├── api/
│   │   └── v1/
│   │       ├── patients/
│   │       ├── appointments/
│   │       ├── availability/
│   │       ├── financial/
│   │       └── integrations/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── agenda/
│   ├── patients/
│   ├── financial/
│   ├── forms/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── supabase/
│   ├── validation/
│   ├── permissions/
│   ├── phone/
│   ├── dates/
│   └── api/
├── services/
│   ├── appointments/
│   ├── availability/
│   ├── patients/
│   ├── financial/
│   └── integrations/
├── types/
├── hooks/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── policies/
├── docs/
│   ├── SPEC.md
│   ├── API.md
│   └── DATABASE.md
├── public/
├── middleware.ts
├── package.json
└── README.md
```

---

# 17. Modelo inicial do banco

## 17.1 clinics

```sql
create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  document text,
  phone text,
  email text,
  timezone text not null default 'America/Sao_Paulo',
  logo_url text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 17.2 profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 17.3 clinic_members

```sql
create table clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);
```

## 17.4 professionals

```sql
create table professionals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  specialty text,
  council_type text,
  council_number text,
  phone text,
  email text,
  calendar_color text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 17.5 patients

```sql
create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  normalized_phone text not null,
  phone_display text,
  birth_date date,
  cpf text,
  email text,
  gender text,
  insurance_company_id uuid,
  insurance_plan_id uuid,
  insurance_card_number text,
  insurance_card_expiration date,
  main_professional_id uuid references professionals(id) on delete set null,
  communication_consent boolean not null default false,
  notes text,
  source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, normalized_phone)
);
```

## 17.6 procedures

```sql
create table procedures (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  category text,
  default_duration_minutes integer not null default 30,
  private_price numeric(12,2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 17.7 professional_schedules

```sql
create table professional_schedules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  appointment_interval_minutes integer not null default 30,
  active boolean not null default true
);
```

## 17.8 calendar_blocks

```sql
create table calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
```

## 17.9 appointments

```sql
create table appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete restrict,
  professional_id uuid not null references professionals(id) on delete restrict,
  procedure_id uuid references procedures(id) on delete set null,
  insurance_company_id uuid,
  care_type text not null check (care_type in ('private', 'insurance')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled',
  expected_value numeric(12,2),
  received_value numeric(12,2) default 0,
  source text not null default 'reception',
  notes text,
  cancellation_reason text,
  previous_appointment_id uuid references appointments(id),
  chatwoot_contact_id text,
  chatwoot_conversation_id text,
  n8n_execution_id text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);
```

## 17.10 financial_transactions

```sql
create table financial_transactions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid references patients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  professional_id uuid references professionals(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  category text,
  description text not null,
  amount numeric(12,2) not null,
  due_date date,
  paid_at timestamptz,
  payment_method text,
  status text not null default 'pending',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 17.11 audit_logs

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);
```

---

# 18. Segurança

Implementar desde o início:

- Row Level Security
- Separação por `clinic_id`
- Permissões por função
- Service role apenas no backend
- Logs de auditoria
- Tokens de integração por clínica
- Rotação de tokens
- Rate limit
- Idempotência
- Validação com Zod
- HTTPS
- Backups automáticos
- Backup externo
- Soft delete para entidades críticas
- Sessão com expiração
- Proteção do Supabase Studio
- Banco não exposto diretamente
- Segredos apenas em variáveis de ambiente

---

# 19. Direção de UX/UI

## 19.1 Conceito

A interface deve transmitir:

- Higiene
- Organização
- Clareza
- Confiança
- Leveza
- Tecnologia discreta

Evitar:

- Excesso de gradientes
- Sombras pesadas
- Muitas cores
- Cards em excesso
- Visual genérico de IA
- Animações desnecessárias
- Informação amontoada

## 19.2 Paleta

```css
--background: #F7FAFC;
--surface: #FFFFFF;
--primary: #176B87;
--primary-secondary: #2F8FA3;
--success: #2F9E83;
--text-primary: #172B3A;
--text-secondary: #637381;
--border: #DCE5EA;
--danger: #C2414A;
--warning: #B7791F;
```

Particular:

```css
--private: #176B87;
```

Convênio:

```css
--insurance: #7566B8;
```

## 19.3 Tipografia

Usar:

- Inter
- Pesos 400, 500, 600 e 700

## 19.4 Componentes

- Sidebar fixa
- Header discreto
- Tabela limpa
- Drawer lateral para formulários
- Modal apenas para ações críticas
- Toast de confirmação
- Skeleton de carregamento
- Estado vazio com orientação
- Ícones Lucide
- Botões com texto claro
- Bordas entre 8 e 10 px
- Sombras mínimas

---

# 20. Esboço da agenda

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Lx Clínicas          Clínica Sorriso             🔔   Usuário       │
├──────────────┬──────────────────────────────────────────────────────┤
│ Agenda       │  Agenda                                             │
│ Pacientes    │                                                      │
│ Financeiro   │  [Hoje] [‹] 21–27 Julho [›]                          │
│ Relatórios   │                                                      │
│ Configuração │  [Todos] [Particular] [Convênio]                     │
│              │                                                      │
│              │  Profissional: [Todos ▼]   [+ Novo agendamento]      │
│              │                                                      │
│              │       Seg       Ter       Qua       Qui       Sex    │
│              │ 08h   Consulta  Livre     Retorno   Consulta  Livre  │
│              │ 09h   Convênio  Avaliação Livre     Bloqueado Livre  │
│              │ 10h   Livre     Consulta  Consulta  Livre     Retorno│
├──────────────┴──────────────────────────────────────────────────────┤
│ Hoje: 18 consultas | 14 confirmadas | 2 aguardando | 2 canceladas  │
└─────────────────────────────────────────────────────────────────────┘
```

Drawer de novo agendamento:

```text
Novo agendamento

Paciente
[Pesquisar nome ou telefone]

Profissional
[Dr. Carlos]

Procedimento
[Avaliação]

Tipo
[Particular] [Convênio]

Data
[21/07/2026]

Horário
[09:00] até [09:45]

Valor previsto
[R$ 150,00]

[Cancelar] [Criar agendamento]
```

---

# 21. Relatórios do MVP

- Agendamentos por período
- Agendamentos por profissional
- Agendamentos por procedimento
- Particular versus convênio
- Cancelamentos
- Faltas
- Taxa de ocupação
- Receita por período
- Receita por profissional
- Receita por procedimento
- Pacientes novos
- Agendamentos realizados pela IA
- Conversões do WhatsApp
- Confirmações automatizadas
- Cancelamentos automatizados

---

# 22. Roadmap

## Fase 1 — Fundação

- [ ] Criar projeto Next.js
- [ ] Configurar TypeScript
- [ ] Configurar Tailwind
- [ ] Configurar shadcn/ui
- [ ] Configurar Supabase
- [ ] Criar autenticação
- [ ] Criar estrutura multiempresa
- [ ] Criar permissões
- [ ] Criar RLS
- [ ] Criar layout base

## Fase 2 — Cadastros

- [ ] Clínica
- [ ] Profissionais
- [ ] Procedimentos
- [ ] Convênios
- [ ] Planos
- [ ] Usuários
- [ ] Horários de trabalho

## Fase 3 — Pacientes

- [ ] Listagem
- [ ] Busca
- [ ] Cadastro
- [ ] Edição
- [ ] Perfil
- [ ] Histórico de agendamentos
- [ ] Financeiro do paciente

## Fase 4 — Agenda

- [ ] Agenda diária
- [ ] Agenda semanal
- [ ] Filtro por profissional
- [ ] Filtro particular
- [ ] Filtro convênio
- [ ] Criar agendamento
- [ ] Editar
- [ ] Reagendar
- [ ] Cancelar
- [ ] Confirmar
- [ ] Marcar falta
- [ ] Marcar atendido
- [ ] Bloquear horário
- [ ] Prevenir conflito

## Fase 5 — Financeiro

- [ ] Receitas
- [ ] Despesas
- [ ] Pagamentos
- [ ] Pendências
- [ ] Cards
- [ ] Relatórios básicos

## Fase 6 — Integrações

- [ ] API de pacientes
- [ ] API de disponibilidade
- [ ] API de agendamentos
- [ ] Tokens por clínica
- [ ] Idempotência
- [ ] Webhook Chatwoot
- [ ] Fluxo n8n
- [ ] Confirmação
- [ ] Reagendamento
- [ ] Cancelamento
- [ ] Lembretes

## Fase 7 — Produção

- [ ] Revisão de segurança
- [ ] Testes de RLS
- [ ] Testes de permissões
- [ ] Testes mobile
- [ ] Backup automático
- [ ] Monitoramento
- [ ] Deploy no Coolify
- [ ] Documentação

---

# 23. Critérios de aceite do MVP

O MVP será considerado funcional quando:

- Um administrador conseguir cadastrar a clínica
- Um administrador conseguir cadastrar profissionais
- Um profissional tiver horários configurados
- Uma recepcionista conseguir cadastrar pacientes
- Um usuário conseguir criar um agendamento
- O sistema impedir conflito de horário
- O usuário conseguir filtrar particular e convênio
- O usuário conseguir cancelar e reagendar
- O usuário conseguir registrar pagamento
- O n8n conseguir consultar disponibilidade
- O n8n conseguir criar agendamento
- O Chatwoot conseguir enviar dados da conversa
- O sistema registrar a origem do agendamento
- Um usuário da clínica A não conseguir acessar dados da clínica B
- O sistema manter logs das ações críticas
- O backup do banco estiver configurado

---

# 24. Primeira entrega visual

Criar inicialmente apenas o frontend navegável com dados simulados:

1. Login
2. Layout principal
3. Agenda semanal
4. Drawer de novo agendamento
5. Lista de pacientes
6. Perfil do paciente
7. Financeiro básico
8. Configurações da clínica
9. Profissionais
10. Procedimentos
11. Convênios

Objetivo:

- Validar navegação
- Validar hierarquia visual
- Validar fluxo da recepção
- Validar simplicidade
- Ajustar UX antes do banco e das integrações

---

# 25. Ordem de implementação recomendada

```text
1. Design system
2. Layout
3. Autenticação
4. Multiempresa
5. Profissionais
6. Procedimentos
7. Pacientes
8. Agenda
9. Validação de conflitos
10. Financeiro
11. API
12. n8n
13. Chatwoot
14. Segurança
15. Deploy
```

---

# 26. Decisão arquitetural principal

A agenda do Lx Clínicas deve ser a fonte oficial.

Não usar:

- Google Calendar como fonte principal
- Chatwoot como banco de pacientes
- n8n como banco de disponibilidade
- Planilha como fonte de agendamentos

Todos os canais devem consultar a mesma API:

```text
Recepção
Site
Link de agendamento
WhatsApp
Agente de IA
Profissional
```

---

# 27. Próximo passo

Começar pela primeira entrega visual com dados simulados.

A primeira versão deve ter:

- Sidebar
- Header
- Agenda semanal
- Filtro particular e convênio
- Filtro por profissional
- Cards de resumo
- Drawer de novo agendamento
- Tela de pacientes
- Tela financeira
- Tela de configurações

Após aprovação do visual:

- Criar banco
- Criar migrations
- Criar RLS
- Conectar autenticação
- Conectar dados reais
- Criar API
- Integrar n8n e Chatwoot
