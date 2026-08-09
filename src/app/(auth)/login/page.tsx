import { AuthNotice, AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

const ERRORS: Record<string, string> = {
  "sem-acesso": "Seu usuário ainda não está vinculado a nenhuma clínica. Fale com o administrador.",
  "senha-alterada": "Senha alterada. Entre com a nova senha.",
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;
  const message = erro ? ERRORS[erro] : undefined;

  return (
    <AuthShell title="Bem-vindo à Lx Clínicas" description="Acesse a gestão da sua clínica">
      {message && <AuthNotice tone={erro === "senha-alterada" ? "success" : "warning"}>{message}</AuthNotice>}
      <LoginForm next={next} />
    </AuthShell>
  );
}
