import { notFound } from "next/navigation";
import { PatientProfile } from "@/components/patient-profile";
import { requireSession } from "@/lib/auth/session";
import { getPatientDetail } from "@/lib/queries/patients";

export default async function Patient({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const patient = await getPatientDetail(session.clinicId, id, session.timezone);

  if (!patient) notFound();

  return <PatientProfile patient={patient} clinicName={session.clinicName} />;
}
