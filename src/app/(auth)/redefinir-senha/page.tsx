import Link from "next/link";
import { AuthNotice, AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";

/**
 * Só é alcançável com a sessão que /auth/confirmar cria a partir do link do
 * e-mail. Sem ela o formulário não teria como gravar nada, então a página
 * explica o que houve em vez de deixar o usuário tentar e falhar.
 */
export default async function RedefinirSenha() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell title="Link expirado" description="Não foi possível validar seu pedido">
        <AuthNotice tone="warning">
          Esse link já foi usado ou passou da validade. Peça um novo para continuar.
        </AuthNotice>
        <Link className="button button-primary w-full" href="/esqueci-minha-senha">
          Pedir novo link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Criar nova senha" description={`Redefinindo o acesso de ${user.email}`}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
