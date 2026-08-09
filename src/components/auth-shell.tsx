import { Stethoscope } from "lucide-react";

/** Moldura comum das telas públicas: login, esqueci a senha e redefinir senha. */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="w-full max-w-[410px]">
        <div className="mb-7 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary)] text-white">
            <Stethoscope />
          </span>
          <h1 className="mt-4 text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm muted">{description}</p>
        </div>
        <div className="panel p-6">{children}</div>
      </section>
    </main>
  );
}

/** Aviso no topo do cartão — erro herdado da URL ou confirmação de envio. */
export function AuthNotice({ tone, children }: { tone: "warning" | "success"; children: React.ReactNode }) {
  const styles =
    tone === "success"
      ? "bg-[#e8f6f1] text-[#237661]"
      : "bg-[#fdf6e7] text-[var(--warning)]";

  return (
    <p role="alert" className={`mb-4 rounded-lg px-3 py-2 text-xs font-medium ${styles}`}>
      {children}
    </p>
  );
}
