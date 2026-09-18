import { notFound } from "next/navigation";
import { ClinicForm } from "./clinic-form";
import { IntegrationTokens } from "./integration-tokens";
import { PageHeader } from "./page-header";
import { ProfessionalsTable } from "./professionals-table";
import { SettingsNav } from "./settings-nav";
import { StatusBadge } from "./status-badge";
import { requireSession } from "@/lib/auth/session";
import { dateLabel } from "@/lib/dates";
import { ROLE_LABEL } from "@/lib/domain";
import {
  getClinic,
  getSubscription,
  listInsurance,
  listIntegrationTokens,
  listMembers,
  listProcedures,
  listProfessionals,
} from "@/lib/queries/settings";
import { brl } from "@/lib/utils";

import { SubscriptionSection } from "./subscription-section";

const META: Record<string, { title: string; description: string }> = {
  clinica: { title: "Dados da clínica", description: "Informações gerais e funcionamento" },
  plano: { title: "Plano & Assinatura", description: "Gerencie seu plano, cotas contratadas e faturamento" },
  profissionais: { title: "Profissionais", description: "Equipe clínica e disponibilidade" },
  procedimentos: { title: "Procedimentos", description: "Serviços, duração e valores" },
  convenios: { title: "Convênios", description: "Operadoras e planos" },
  usuarios: { title: "Usuários", description: "Equipe, funções e permissões" },
  integracoes: { title: "Integrações", description: "Canais e automações" },
};

function EmptyRow({ colSpan, children }: { colSpan: number; children: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-10 text-center text-sm muted">{children}</td>
    </tr>
  );
}

export async function SettingsPage({ kind }: { kind: string }) {
  const meta = META[kind];
  if (!meta) notFound();

  const session = await requireSession();
  const isAdmin = session.role === "admin";

  return (
    <>
      <PageHeader title={meta.title} description={meta.description} />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <SettingsNav />
        <section className="panel p-5">
          {kind === "clinica" && <ClinicSection clinicId={session.clinicId} canEdit={isAdmin} />}
          {kind === "plano" && <PlanSection clinicId={session.clinicId} isAdmin={isAdmin} />}
          {kind === "profissionais" && <ProfessionalsSection clinicId={session.clinicId} isAdmin={isAdmin} />}
          {kind === "procedimentos" && <ProceduresSection clinicId={session.clinicId} />}
          {kind === "convenios" && <InsuranceSection clinicId={session.clinicId} />}
          {kind === "usuarios" && <MembersSection clinicId={session.clinicId} timezone={session.timezone} />}
          {kind === "integracoes" && (
            <IntegrationsSection clinicId={session.clinicId} timezone={session.timezone} isAdmin={isAdmin} />
          )}
        </section>
      </div>
    </>
  );
}

async function ClinicSection({ clinicId, canEdit }: { clinicId: string; canEdit: boolean }) {
  const clinic = await getClinic(clinicId);
  if (!clinic) return <p className="text-sm muted">Clínica não encontrada.</p>;

  return (
    <>
      {!canEdit && (
        <p className="mb-4 rounded-lg bg-[#f5f8fa] px-3 py-2 text-xs muted">
          Somente administradores podem alterar estes dados.
        </p>
      )}
      <ClinicForm clinic={clinic} canEdit={canEdit} />
    </>
  );
}

async function PlanSection({ clinicId, isAdmin }: { clinicId: string; isAdmin: boolean }) {
  const [subscription, professionals] = await Promise.all([
    getSubscription(clinicId),
    listProfessionals(clinicId),
  ]);
  const activeCount = professionals.filter((p) => p.active).length;

  return (
    <SubscriptionSection
      subscription={subscription}
      activeProfessionalsCount={activeCount}
      isAdmin={isAdmin}
    />
  );
}

async function ProfessionalsSection({ clinicId, isAdmin }: { clinicId: string; isAdmin: boolean }) {
  const [professionals, procedures, subscription] = await Promise.all([
    listProfessionals(clinicId),
    listProcedures(clinicId),
    getSubscription(clinicId),
  ]);

  return (
    <ProfessionalsTable
      professionals={professionals}
      allProcedures={procedures}
      subscription={subscription}
      isAdmin={isAdmin}
    />
  );
}

async function ProceduresSection({ clinicId }: { clinicId: string }) {
  const procedures = await listProcedures(clinicId);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Procedimento</th>
            <th>Categoria</th>
            <th>Duração</th>
            <th>Valor particular</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {procedures.map((procedure) => (
            <tr key={procedure.id}>
              <td className="font-medium">{procedure.name}</td>
              <td>{procedure.category ?? "—"}</td>
              <td>{procedure.default_duration_minutes} min</td>
              <td>{procedure.private_price === null ? "—" : brl(procedure.private_price)}</td>
              <td><StatusBadge status={procedure.active ? "Ativo" : "Inativo"} /></td>
            </tr>
          ))}
          {procedures.length === 0 && <EmptyRow colSpan={5}>Nenhum procedimento cadastrado.</EmptyRow>}
        </tbody>
      </table>
    </div>
  );
}

async function InsuranceSection({ clinicId }: { clinicId: string }) {
  const companies = await listInsurance(clinicId);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Convênio</th>
            <th>Registro</th>
            <th>Prazo de recebimento</th>
            <th>Planos</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td className="font-medium">{company.name}</td>
              <td>{company.registration_code ?? "—"}</td>
              <td>{company.average_payment_days === null ? "—" : `${company.average_payment_days} dias`}</td>
              <td>{company.insurance_plans.map((plan) => plan.name).join(", ") || "—"}</td>
              <td><StatusBadge status={company.active ? "Ativo" : "Inativo"} /></td>
            </tr>
          ))}
          {companies.length === 0 && <EmptyRow colSpan={5}>Nenhum convênio cadastrado.</EmptyRow>}
        </tbody>
      </table>
    </div>
  );
}

async function MembersSection({ clinicId, timezone }: { clinicId: string; timezone: string }) {
  const members = await listMembers(clinicId);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Função</th>
            <th>Telefone</th>
            <th>Desde</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td className="font-medium">{member.profile?.full_name ?? "—"}</td>
              <td>{ROLE_LABEL[member.role]}</td>
              <td>{member.profile?.phone ?? "—"}</td>
              <td>{dateLabel(member.created_at, timezone)}</td>
              <td><StatusBadge status={member.status === "active" ? "Ativo" : "Inativo"} /></td>
            </tr>
          ))}
          {members.length === 0 && <EmptyRow colSpan={5}>Nenhum usuário vinculado.</EmptyRow>}
        </tbody>
      </table>
    </div>
  );
}

async function IntegrationsSection({
  clinicId,
  timezone,
  isAdmin,
}: {
  clinicId: string;
  timezone: string;
  isAdmin: boolean;
}) {
  const tokens = await listIntegrationTokens(clinicId, timezone);

  return (
    <>
      <p className="mb-4 rounded-lg bg-[#f5f8fa] px-3 py-2 text-xs muted">
        Tokens de acesso à API <code>/api/v1</code> — use no n8n, Chatwoot e no agente de IA.
        Cada token pertence a esta clínica e pode ser revogado a qualquer momento.
        Endpoints e exemplos em <code>docs/API.md</code>.
      </p>
      <IntegrationTokens tokens={tokens} canManage={isAdmin} />
    </>
  );
}
