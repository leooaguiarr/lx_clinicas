"use client";

import { Copy, KeyRound, ShieldOff } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createIntegrationToken, revokeIntegrationToken, type TokenFormState } from "@/lib/actions/integrations";
import { StatusBadge } from "./status-badge";

export type TokenListItem = {
  id: string;
  name: string;
  token_prefix: string;
  scopes: string[];
  active: boolean;
  last_used_at: string | null;
  created_label: string;
  last_used_label: string;
};

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" type="submit" disabled={pending}>
      <KeyRound size={16} />
      {pending ? "Gerando…" : "Gerar token"}
    </button>
  );
}

export function IntegrationTokens({ tokens, canManage }: { tokens: TokenListItem[]; canManage: boolean }) {
  const [state, formAction] = useActionState<TokenFormState, FormData>(createIntegrationToken, {});
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    if (!state.token) return;
    await navigator.clipboard.writeText(state.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-5">
      {canManage && (
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <label className="label min-w-[220px] flex-1">
            Nome do token
            <input className="input" name="name" placeholder="n8n" defaultValue="n8n" required minLength={2} />
          </label>
          <GenerateButton />
        </form>
      )}

      {state.error && (
        <p role="alert" className="rounded-lg bg-[#fdf0f1] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}

      {state.token && (
        <div className="rounded-lg border border-[var(--warning)] bg-[#fdf6e7] p-4">
          <p className="text-xs font-semibold text-[var(--warning)]">
            Copie agora — o token não será exibido novamente.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="block flex-1 overflow-x-auto rounded bg-white px-3 py-2 text-xs">{state.token}</code>
            <button type="button" className="button !p-2" onClick={copyToken} aria-label="Copiar token">
              <Copy size={15} />
            </button>
          </div>
          {copied && <p className="mt-1 text-xs text-[var(--success)]">Copiado.</p>}
          <p className="mt-2 text-xs muted">
            No n8n, use como header: <code>Authorization: Bearer {state.prefix}…</code>
          </p>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Prefixo</th>
              <th>Criado</th>
              <th>Último uso</th>
              <th>Status</th>
              {canManage && <th aria-label="Ações" />}
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                <td className="font-medium">{token.name}</td>
                <td><code className="text-xs">{token.token_prefix}…</code></td>
                <td>{token.created_label}</td>
                <td>{token.last_used_label}</td>
                <td><StatusBadge status={token.active ? "Ativo" : "Cancelado"} /></td>
                {canManage && (
                  <td>
                    {token.active && (
                      <form action={revokeIntegrationToken}>
                        <input type="hidden" name="id" value={token.id} />
                        <button type="submit" className="button !px-2 !py-1.5 text-xs" title="Revogar token">
                          <ShieldOff size={13} />
                          Revogar
                        </button>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="p-8 text-center text-sm muted">
                  Nenhum token gerado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
