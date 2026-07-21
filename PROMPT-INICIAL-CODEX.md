# Prompt inicial para o Codex — Lx Clínicas

Crie o esboço inicial de um appweb chamado **Lx Clínicas**, destinado à gestão de clínicas, com foco inicial em clínicas odontológicas.

Leia integralmente o arquivo `SPEC-LX-CLINICAS-MVP.md` antes de iniciar.

## Objetivo desta primeira etapa

Criar somente o frontend navegável do MVP, usando dados simulados.

Não conectar Supabase nesta etapa.

Não implementar API real nesta etapa.

Não implementar autenticação real nesta etapa.

O objetivo é validar:

- Layout
- Navegação
- Hierarquia visual
- Fluxo da recepção
- Agenda
- Cadastro de pacientes
- Financeiro básico
- Configurações

## Stack obrigatória

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- React Hook Form
- Zod
- FullCalendar ou uma agenda semanal própria

## Direção visual

A interface deve transmitir:

- Higiene
- Organização
- Clareza
- Confiança
- Leveza
- Tecnologia discreta

Evite aparência genérica de IA.

Não usar:

- Gradientes exagerados
- Sombras pesadas
- Glassmorphism
- Cards em excesso
- Cores neon
- Animações desnecessárias
- Elementos decorativos sem função

## Paleta

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
--private: #176B87;
--insurance: #7566B8;
```

## Tipografia

Usar Inter.

## Páginas

Criar:

- `/login`
- `/agenda`
- `/pacientes`
- `/pacientes/[id]`
- `/financeiro`
- `/relatorios`
- `/configuracoes`
- `/configuracoes/clinica`
- `/configuracoes/profissionais`
- `/configuracoes/procedimentos`
- `/configuracoes/convenios`
- `/configuracoes/usuarios`
- `/configuracoes/integracoes`

## Layout

Criar:

- Sidebar fixa
- Header discreto
- Área principal responsiva
- Menu recolhível no mobile
- Identificação da clínica
- Menu do usuário
- Notificações simuladas

Menu:

- Agenda
- Pacientes
- Financeiro
- Relatórios
- Configurações

## Tela Agenda

A agenda deve ser a página inicial.

Criar:

- Visualização semanal
- Botão Hoje
- Navegação entre semanas
- Filtro Todos
- Filtro Particular
- Filtro Convênio
- Filtro por profissional
- Botão Novo agendamento
- Cards de resumo do dia
- Horários bloqueados
- Agendamentos simulados

Status:

- Agendado
- Confirmado
- Atendido
- Cancelado
- Faltou

Ao clicar em horário vazio:

- Abrir drawer lateral

Campos do drawer:

- Paciente
- Profissional
- Procedimento
- Particular ou convênio
- Convênio
- Data
- Hora inicial
- Hora final
- Valor previsto
- Observação

Criar validação simulada com Zod.

## Tela Pacientes

Criar:

- Busca
- Filtros
- Tabela
- Botão Novo paciente
- Dados simulados
- Indicadores simples
- Paginação visual

Colunas:

- Nome
- Telefone
- Última consulta
- Próxima consulta
- Profissional
- Tipo
- Convênio
- Saldo
- Status

## Perfil do paciente

Criar abas:

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
- Faltas
- Cancelamentos
- Pendência
- Botão WhatsApp
- Botão Novo agendamento

## Financeiro

Criar:

- Cards
- Receitas
- Despesas
- Filtros por período
- Tabela de movimentações
- Gráfico simples
- Status financeiro

Cards:

- Recebido hoje
- Recebido no mês
- A receber
- Despesas
- Saldo
- Inadimplência

## Configurações

Criar telas para:

- Clínica
- Profissionais
- Procedimentos
- Convênios
- Usuários
- Integrações

Usar formulários simulados.

## Dados simulados

Criar dados realistas em português do Brasil.

Usar:

- Dentistas
- Pacientes
- Procedimentos odontológicos
- Convênios
- Valores em reais
- Datas no padrão brasileiro
- Telefone brasileiro
- Fuso America/Sao_Paulo

## Componentes esperados

Criar componentes reutilizáveis:

- AppSidebar
- AppHeader
- PageHeader
- SummaryCard
- StatusBadge
- AppointmentCard
- CalendarToolbar
- AppointmentDrawer
- PatientTable
- PatientSummary
- FinancialSummary
- EmptyState
- ConfirmDialog
- SearchInput
- FilterSelect

## Qualidade

- Código organizado
- Componentes pequenos
- Tipagem forte
- Sem `any`
- Acessibilidade básica
- Navegação por teclado
- Estados de loading
- Estados vazios
- Layout responsivo
- Sem erros no console
- Sem código duplicado

## Entrega

Ao terminar:

1. Apresente a estrutura criada
2. Liste as páginas
3. Liste os componentes
4. Explique como executar
5. Informe quais dados estão simulados
6. Não conecte Supabase ainda
7. Não implemente backend real ainda
