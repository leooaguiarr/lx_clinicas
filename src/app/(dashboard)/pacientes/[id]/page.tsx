import { notFound } from "next/navigation";
import { CalendarPlus, Mail, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireSession } from "@/lib/auth/session";
import { getPatientDetail } from "@/lib/queries/patients";
import { brl } from "@/lib/utils";

export default async function Patient({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const patient = await getPatientDetail(session.clinicId, id, session.timezone);

  if (!patient) notFound();

  const whatsapp = `https://wa.me/${patient.phone.replace(/\D/g, "").replace(/^(?!55)/, "55")}`;

  return (
    <>
      <PageHeader
        title={patient.name}
        description={`Paciente desde ${patient.createdAt} • ${patient.careType}`}
        action={
          <div className="flex gap-2">
            <a className="button" href={whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <a className="button button-primary" href="/agenda">
              <CalendarPlus size={16} />
              Novo agendamento
            </a>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="panel p-5">
          <h2 className="font-bold">Dados pessoais</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs muted">Nome completo</p>
              <p className="mt-1 text-sm font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-xs muted">CPF</p>
              <p className="mt-1 text-sm font-medium">{patient.cpf}</p>
            </div>
            <div>
              <p className="text-xs muted">Telefone</p>
              <p className="mt-1 flex items-center gap-2 text-sm"><Phone size={14} />{patient.phone}</p>
            </div>
            <div>
              <p className="text-xs muted">E-mail</p>
              <p className="mt-1 flex items-center gap-2 text-sm"><Mail size={14} />{patient.email}</p>
            </div>
            <div>
              <p className="text-xs muted">Nascimento</p>
              <p className="mt-1 text-sm">{patient.birthDate}</p>
            </div>
            <div>
              <p className="text-xs muted">Convênio</p>
              <p className="mt-1 text-sm">{patient.insurance}</p>
            </div>
            <div>
              <p className="text-xs muted">Status</p>
              <p className="mt-1"><StatusBadge status={patient.status} /></p>
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-bold">Próxima consulta</h2>
          {patient.nextAppointment ? (
            <>
              <p className="mt-4 text-lg font-bold text-[var(--primary)]">{patient.nextAppointment.date}</p>
              <p className="mt-1 text-sm">{patient.nextAppointment.procedure} • {patient.nextAppointment.professional}</p>
            </>
          ) : (
            <p className="mt-4 text-sm muted">Nenhuma consulta agendada.</p>
          )}
          <p className="mt-4 text-xs muted">{session.clinicName}</p>
        </section>

        <section className="panel p-5 lg:col-span-2">
          <h2 className="font-bold">Indicadores</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              ["Consultas", String(patient.stats.total)],
              ["Última", patient.stats.last],
              ["Faltas", String(patient.stats.noShows)],
              ["Cancelamentos", String(patient.stats.cancellations)],
              ["Pendência", brl(patient.stats.balance)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs muted">{label}</p>
                <p className="mt-1 font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel lg:col-span-2">
          <div className="border-b border-[var(--border)] p-4">
            <h2 className="font-bold">Agendamentos</h2>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Procedimento</th>
                  <th>Profissional</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {patient.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.when}</td>
                    <td className="font-medium">{appointment.procedure}</td>
                    <td>{appointment.professional}</td>
                    <td><StatusBadge status={appointment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patient.appointments.length === 0 && (
              <div className="p-10 text-center text-sm muted">Nenhum agendamento registrado.</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
