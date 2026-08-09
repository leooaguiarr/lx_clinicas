/**
 * Esqueletos exibidos enquanto uma página do dashboard carrega.
 *
 * Cada aba faz várias consultas ao Supabase em sequência (sessão + dados), o
 * que leva perto de um segundo. Sem um `loading.tsx`, o App Router segura a
 * tela anterior durante todo esse tempo e a navegação parece travada — o
 * esqueleto troca essa espera cega por uma resposta imediata.
 *
 * A silhueta imita o layout real para a página não "pular" quando os dados
 * chegam.
 */

function Bar({ className = "" }: { className?: string }) {
  return <span className={`block rounded bg-[#e8eef1] ${className}`} />;
}

export function SkeletonHeader({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Bar className="h-7 w-44" />
        <Bar className="mt-2 h-4 w-64" />
      </div>
      {withAction && <Bar className="h-10 w-44 rounded-lg" />}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`mb-4 grid grid-cols-2 gap-3 ${count > 4 ? "xl:grid-cols-6" : "lg:grid-cols-4"}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="panel p-4">
          <Bar className="h-3 w-24" />
          <Bar className="mt-3 h-6 w-20" />
          <Bar className="mt-3 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex gap-6 border-b border-[var(--border)] bg-[#fbfcfd] px-4 py-3">
        {Array.from({ length: columns }, (_, index) => (
          <Bar key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-6 border-b border-[#edf2f4] px-4 py-4 last:border-b-0">
          {Array.from({ length: columns }, (_, column) => (
            <Bar key={column} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </section>
  );
}

/** Grade semanal da agenda: coluna de horas + colunas de dias. */
export function SkeletonAgenda({ days = 5, rows = 10 }: { days?: number; rows?: number }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-3">
        <div className="flex gap-2">
          <Bar className="h-9 w-16 rounded-lg" />
          <Bar className="h-9 w-9 rounded-lg" />
          <Bar className="h-9 w-9 rounded-lg" />
          <Bar className="ml-1 h-4 w-28 self-center" />
        </div>
        <div className="flex gap-2">
          <Bar className="h-9 w-40 rounded-lg" />
          <Bar className="h-9 w-48 rounded-lg" />
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: `64px repeat(${days}, minmax(0, 1fr))` }}>
        <div className="h-12 border-b border-r border-[var(--border)]" />
        {Array.from({ length: days }, (_, index) => (
          <div key={index} className="grid h-12 place-items-center border-b border-r border-[var(--border)]">
            <Bar className="h-3 w-14" />
          </div>
        ))}
        {Array.from({ length: rows }, (_, row) => (
          <div className="contents" key={row}>
            <div className="h-12 border-b border-r border-[var(--border)] pr-2 pt-2 text-right">
              <Bar className="ml-auto h-2.5 w-8" />
            </div>
            {Array.from({ length: days }, (_, column) => (
              <div key={column} className="h-12 border-b border-r border-[var(--border)] bg-white" />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SkeletonPanel({ lines = 4, className = "" }: { lines?: number; className?: string }) {
  return (
    <section className={`panel p-5 ${className}`}>
      <Bar className="h-4 w-52" />
      <div className="mt-7 space-y-5">
        {Array.from({ length: lines }, (_, index) => (
          <div key={index}>
            <div className="mb-2 flex justify-between">
              <Bar className="h-3 w-32" />
              <Bar className="h-3 w-20" />
            </div>
            <Bar className="h-3 w-full rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Envolve o conteúdo com a animação e esconde os esqueletos de leitores de tela. */
export function SkeletonScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-pulse" aria-busy role="status" aria-label="Carregando">
      {children}
    </div>
  );
}
