import { PageHeader } from "@/components/page-header";
import { SummaryCard } from "@/components/summary-card";
import { requireSession } from "@/lib/auth/session";
import { getReportsData } from "@/lib/queries/reports";

export default async function Relatorios() {
  const session = await requireSession();
  const data = await getReportsData(session.clinicId, session.timezone);

  return (
    <>
      <PageHeader title="Relatórios" description="Indicadores operacionais da clínica" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Taxa de ocupação" value={`${data.occupancyRate}%`} note={`Últimos ${data.periodDays} dias`} />
        <SummaryCard label="Agendamentos" value={String(data.totalAppointments)} note={`Últimos ${data.periodDays} dias`} />
        <SummaryCard label="Faltas" value={`${String(data.noShowRate).replace(".", ",")}%`} note={`${data.noShowCount} pacientes`} />
        <SummaryCard label="Via agente de IA" value={String(data.fromAiAgent)} note={`${data.aiAgentShare}% do total`} />
      </div>

      <section className="panel mt-4 p-5">
        <h2 className="font-bold">Agendamentos por profissional</h2>
        <div className="mt-7 space-y-5">
          {data.byProfessional.map((item) => (
            <div key={item.name}>
              <div className="mb-2 flex justify-between text-sm">
                <span>{item.name}</span>
                <b>{item.count} atendimentos</b>
              </div>
              <div className="h-3 rounded-full bg-[#edf2f4]">
                <div className="h-3 rounded-full bg-[var(--primary)]" style={{ width: `${item.share}%` }} />
              </div>
            </div>
          ))}
          {data.byProfessional.length === 0 && (
            <p className="text-sm muted">Nenhum agendamento no período.</p>
          )}
        </div>
      </section>
    </>
  );
}
