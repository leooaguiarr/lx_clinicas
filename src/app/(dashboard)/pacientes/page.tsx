import { PageHeader } from "@/components/page-header";
import { PatientTable } from "@/components/patient-table";
import { SummaryCard } from "@/components/summary-card";
import { requireSession } from "@/lib/auth/session";
import { getSchedulingCatalogs } from "@/lib/queries/agenda";
import { listPatients } from "@/lib/queries/patients";

export default async function Pacientes({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; tipo?: string; pagina?: string }>;
}) {
  const session = await requireSession();
  const { busca, tipo, pagina } = await searchParams;
  const page = Math.max(1, Number.parseInt(pagina ?? "1", 10) || 1);

  const [result, catalogs] = await Promise.all([
    listPatients(session.clinicId, session.timezone, { search: busca, careType: tipo, page }),
    getSchedulingCatalogs(session.clinicId),
  ]);

  return (
    <>
      <PageHeader title="Pacientes" description="Cadastros e histórico de relacionamento" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Pacientes ativos" value={String(result.summary.active)} />
        <SummaryCard label="Novos este mês" value={String(result.summary.newThisMonth)} />
        <SummaryCard label="Com consulta futura" value={String(result.summary.withUpcoming)} />
        <SummaryCard label="Com pendências" value={String(result.summary.withDebt)} />
      </div>
      <PatientTable
        result={result}
        page={page}
        professionals={catalogs.professionals}
        insuranceCompanies={catalogs.insuranceCompanies}
      />
    </>
  );
}
