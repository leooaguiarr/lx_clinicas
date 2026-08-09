import { AuthNotice, AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

const ERRORS: Record<string, string> = {
  "link-invalido": "Esse link expirou ou já foi usado. Peça um novo abaixo.",
};

export default async function EsqueciMinhaSenha({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const message = erro ? ERRORS[erro] : undefined;

  return (
    <AuthShell
      title="Recuperar acesso"
      description="Enviaremos um link para você criar uma nova senha"
    >
      {message && <AuthNotice tone="warning">{message}</AuthNotice>}
      <ForgotPasswordForm />
    </AuthShell>
  );
}
