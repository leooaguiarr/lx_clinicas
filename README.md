# Lx Clínicas

Appweb de gestão para clínicas odontológicas, construído com Next.js, React, TypeScript, Tailwind CSS, React Hook Form, Zod, Lucide Icons e Supabase.

O frontend está conectado ao Supabase: autenticação, agenda, pacientes, financeiro, relatórios e configurações leem e gravam no banco real. Não há mais dados simulados.

## Executar localmente

Requer Node.js 20.9 ou superior e uma instância Supabase acessível.

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha as três variáveis (ver "Configurar o Supabase" abaixo).

```bash
npm run dev
```

Acesse `http://localhost:3000`. Para verificar a versão de produção:

```bash
npm run build
npm start
```

## Configurar o Supabase

### 1. Variáveis de ambiente

| Variável | Onde encontrar | Exposta no browser |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública da instância, sem barra no final | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave `anon` — respeita RLS | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave `service_role` — **ignora RLS** | Não |

No Supabase self-hosted as duas chaves são os JWTs `ANON_KEY` e `SERVICE_ROLE_KEY` do `.env` do Docker; no Supabase Cloud ficam em *Project Settings → API*.

A `service_role` nunca deve ser commitada nem usada em código que chegue ao browser. `.env*` já está no `.gitignore`.

### 2. Banco de dados

O schema **já existe** na instância e não é criado por este repositório — não há migrations a aplicar.
Estrutura, enums e dados existentes estão documentados em [supabase/README.md](supabase/README.md).

### 3. Criar o primeiro usuário

`clinic_members` está vazio, então nenhum usuário consegue entrar ainda.

No Supabase Studio: *Authentication → Users → Add user*, com e-mail e senha, marcando o e-mail
como confirmado. Depois, no SQL Editor, vincule o usuário à clínica e crie o profile
(veja os comandos em [supabase/README.md](supabase/README.md)).

Sem o vínculo em `clinic_members` o login funciona, mas o app redireciona para
`/login?erro=sem-acesso` — é o comportamento esperado.

## Perfis de acesso

| Papel | `clinic_members.role` | Acesso |
| --- | --- | --- |
| Administrador | `admin` | Tudo, incluindo configurações e financeiro |
| Recepção | `reception` | Agenda, pacientes e financeiro; não altera cadastros |
| Financeiro | `finance` | Financeiro e leitura da operação |
| Profissional | `professional` | Agenda e pacientes; sem acesso ao financeiro |

As regras são aplicadas no banco por RLS, não só na interface.

## Rotas

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

## Estrutura

```text
src/
├── app/                      rotas (auth) e (dashboard)
├── components/               UI
├── lib/
│   ├── actions/              Server Actions (auth, agendamentos, pacientes, configurações)
│   ├── auth/session.ts       usuário logado + clínica ativa
│   ├── queries/              leitura por domínio
│   ├── supabase/             clients browser, server, admin e proxy
│   ├── dates.ts              datas no fuso da clínica
│   └── domain.ts             enums do banco → rótulos pt-BR
├── types/database.ts         tipos das tabelas
└── proxy.ts                  renova sessão e protege o dashboard

supabase/
└── README.md                 estrutura real do banco (o schema vive na instância)
```

## Ainda não implementado

- CRUD nas telas de configurações (as listagens já mostram dados reais)
- API REST `/api/v1` para n8n, Chatwoot e o agente de IA da Lexion
- Supabase Storage para documentos do paciente
- Escrita em `audit_logs`
