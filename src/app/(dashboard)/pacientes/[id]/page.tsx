import { notFound } from "next/navigation";
import { PatientProfile } from "@/components/patient-profile";
import { patients } from "@/lib/mock-data";

export default async function Patient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = patients.find((p) => p.id === id);
  if (!patient) notFound();
  return <PatientProfile patient={patient} />;
}
