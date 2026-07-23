import { AgendaView } from "@/components/agenda-view";
import { requireSession } from "@/lib/auth/session";
import { getAgendaData, getSchedulingCatalogs } from "@/lib/queries/agenda";
import { listPatientOptions } from "@/lib/queries/patients";
import type { CareType } from "@/types/database";

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; tipo?: string; profissional?: string }>;
}) {
  const session = await requireSession();
  const { semana, tipo, profissional } = await searchParams;

  const [data, catalogs, patients] = await Promise.all([
    getAgendaData(session.clinicId, session.timezone, {
      weekOffset: Number.parseInt(semana ?? "0", 10) || 0,
      careType: tipo === "private" || tipo === "insurance" ? (tipo as CareType) : null,
      professionalId: profissional || null,
    }),
    getSchedulingCatalogs(session.clinicId),
    listPatientOptions(session.clinicId),
  ]);

  return <AgendaView data={data} catalogs={{ ...catalogs, patients }} />;
}
