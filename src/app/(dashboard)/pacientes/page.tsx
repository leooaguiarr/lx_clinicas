import { PageHeader } from "@/components/page-header";
import { PatientTable } from "@/components/patient-table";
import { SummaryCard } from "@/components/summary-card";
export default function Pacientes() {
  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Cadastros e histórico de relacionamento"
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Pacientes cadastrados" value="12" />
        <SummaryCard label="Novos este mês" value="3" />
        <SummaryCard label="Com consulta futura" value="7" />
        <SummaryCard label="Com pendências" value="4" />
      </div>
      <PatientTable />
    </>
  );
}
