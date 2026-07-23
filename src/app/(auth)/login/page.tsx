import { Stethoscope } from "lucide-react";
import { LoginForm } from "@/components/login-form";

const ERRORS: Record<string, string> = {
  "sem-acesso": "Seu usuário ainda não está vinculado a nenhuma clínica. Fale com o administrador.",
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;
  const message = erro ? ERRORS[erro] : undefined;

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="w-full max-w-[410px]">
        <div className="mb-7 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary)] text-white">
            <Stethoscope />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Bem-vindo à Lx Clínicas</h1>
          <p className="mt-1 text-sm muted">Acesse a gestão da sua clínica</p>
        </div>
        <div className="panel p-6">
          {message && (
            <p role="alert" className="mb-4 rounded-lg bg-[#fdf6e7] px-3 py-2 text-xs font-medium text-[var(--warning)]">
              {message}
            </p>
          )}
          <LoginForm next={next} />
        </div>
      </section>
    </main>
  );
}
