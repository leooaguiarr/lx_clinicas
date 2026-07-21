# Lx Clínicas

Frontend navegável do MVP de gestão para clínicas odontológicas, construído com Next.js, React, TypeScript, Tailwind CSS, React Hook Form, Zod e Lucide Icons.

Esta etapa usa exclusivamente dados simulados. Não há Supabase, API, backend ou autenticação real.

## Executar localmente

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Para verificar a versão de produção:

```bash
npm run build
npm start
```

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

## Escopo atual

- Agenda semanal com filtros e drawer validado com Zod
- Lista e perfil de pacientes
- Resumo financeiro, gráfico visual e movimentações
- Relatórios operacionais
- Configurações simuladas da clínica
- Layout responsivo com navegação mobile

Os dados de pacientes, dentistas, consultas, convênios e valores estão em `src/lib/mock-data.ts`.
