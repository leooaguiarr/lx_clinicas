# Instruções para agentes de IA — Lx Clínicas

1. **Comece lendo `CONTINUIDADE.md`** — é a fonte de verdade sobre o estado do projeto,
   decisões já tomadas e pegadinhas conhecidas. Não redescubra o que já está documentado lá.

2. **Antes de todo `git push`, atualize `CONTINUIDADE.md`**:
   - a linha "Última atualização" (data + resumo curto);
   - a seção 2 (o que está pronto) e a seção 5 (próximos passos), se mudaram;
   - uma linha nova na seção 6 (histórico) quando a entrega for relevante.
   O hook `.githooks/pre-push` **bloqueia** pushes que não incluam mudança no arquivo.

3. Regras técnicas inegociáveis:
   - O schema do banco vive na instância Supabase, **não** neste repositório (`supabase/README.md`).
   - Nunca commitar segredos. `.env.local` está no `.gitignore` — mantenha assim.
   - A chave `service_role` só é usada em código server-only (`src/lib/supabase/admin.ts`).
   - Interface em pt-BR; enums do banco em inglês, traduzidos em `src/lib/domain.ts`.
   - Validação de IDs com `uuidSchema` (`src/lib/validation.ts`), não `z.string().uuid()`.

4. Build de verificação: `npx tsc --noEmit` e `npm run build`.
   Deploy: `npx vercel deploy --prod --yes`.
