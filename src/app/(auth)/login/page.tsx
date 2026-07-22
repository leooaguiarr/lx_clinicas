import Link from "next/link";
import { Stethoscope } from "lucide-react";
export default function Login() {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="w-full max-w-[410px]">
        <div className="mb-7 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary)] text-white">
            <Stethoscope />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Bem-vindo à Lx Clínicas</h1>
          <p className="mt-1 text-sm muted">
            Acesse a gestão da Clínica Sorriso
          </p>
        </div>
        <div className="panel p-6">
          <form className="space-y-4">
            <label className="label">
              E-mail
              <input
                className="input"
                type="email"
                defaultValue="recepcao@clinicasorriso.com.br"
              />
            </label>
            <label className="label">
              Senha
              <input
                className="input"
                type="password"
                defaultValue="12345678"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-semibold text-[var(--primary)]"
              >
                Esqueci minha senha
              </button>
            </div>
            <Link href="/agenda" className="button button-primary w-full">
              Entrar
            </Link>
          </form>
          <p className="mt-5 text-center text-xs muted">
            Acesso demonstrativo • dados simulados
          </p>
        </div>
      </section>
    </main>
  );
}
