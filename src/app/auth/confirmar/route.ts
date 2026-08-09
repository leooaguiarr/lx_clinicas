import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { logWarn } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";

/**
 * Destino do link enviado por e-mail (redefinição de senha, convite, confirmação).
 * Troca o token da URL por uma sessão e encaminha para a página final.
 *
 * Aceita as duas formas porque o formato depende do template de e-mail
 * configurado na instância: `?code=` no fluxo PKCE (padrão do @supabase/ssr) e
 * `?token_hash=&type=` quando o template usa `{{ .TokenHash }}`. Nossa instância
 * é self-hosted, então é mais seguro cobrir as duas do que presumir uma.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = safeNext(searchParams.get("next"), "/redefinir-senha");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
    logWarn("auth.confirmar", "falha ao trocar code por sessão", { reason: error.message });
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
    logWarn("auth.confirmar", "falha ao verificar token_hash", { type, reason: error.message });
  } else {
    logWarn("auth.confirmar", "link sem code nem token_hash");
  }

  // Link vencido ou já usado: o formulário de e-mail explica o que fazer.
  redirect("/esqueci-minha-senha?erro=link-invalido");
}
