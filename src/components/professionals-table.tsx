"use client";

import Link from "next/link";
import { Edit, Mail, Phone, Plus, Sparkles, Stethoscope, UserCheck, UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProfessionalDrawer } from "./professional-drawer";
import { StatusBadge } from "./status-badge";
import { toggleProfessionalActive } from "@/lib/actions/settings";
import type { ProfessionalDetail } from "@/lib/queries/settings";
import type { ClinicSubscriptionRow } from "@/types/database";

function formatScheduleSummary(
  schedules: { weekday: number; active: boolean; start_time: string; end_time: string }[],
): string {
  const activeDays = schedules.filter((s) => s.active);
  if (activeDays.length === 0) return "Sem expediente ativo";

  const weekdays = activeDays.map((s) => s.weekday).sort((a, b) => a - b);
  const isSegSex = weekdays.length === 5 && weekdays.every((d, i) => d === i + 1);
  const isSegSab = weekdays.length === 6 && weekdays.every((d, i) => d === i + 1);

  const first = activeDays[0];
  const timeRange = `${first.start_time.slice(0, 5)} às ${first.end_time.slice(0, 5)}`;

  if (isSegSex) return `Seg a Sex • ${timeRange}`;
  if (isSegSab) return `Seg a Sáb • ${timeRange}`;
  return `${activeDays.length} dia${activeDays.length > 1 ? "s" : ""} por semana`;
}

export function ProfessionalsTable({
  professionals,
  allProcedures,
  subscription,
  isAdmin,
}: {
  professionals: ProfessionalDetail[];
  allProcedures: { id: string; name: string; category: string | null; default_duration_minutes: number }[];
  subscription?: ClinicSubscriptionRow | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<ProfessionalDetail | null>(null);
  const [isPending, startTransition] = useTransition();

  const maxProf = subscription?.max_professionals;
  const activeCount = professionals.filter((p) => p.active).length;
  const isLimitReached = Boolean(maxProf && activeCount >= maxProf);

  function openNew() {
    setEditingProf(null);
    setDrawerOpen(true);
  }

  function openEdit(prof: ProfessionalDetail) {
    setEditingProf(prof);
    setDrawerOpen(true);
  }

  function handleToggleActive(prof: ProfessionalDetail) {
    startTransition(async () => {
      await toggleProfessionalActive(prof.id, !prof.active);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Banner de cota atingida se houver */}
      {isLimitReached && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-200 text-amber-800 font-bold">!</span>
            <div>
              <p className="font-bold">Limite de profissionais atingido no seu plano ({activeCount} de {maxProf})</p>
              <p className="text-[11px] text-amber-700">Faça upgrade de plano para cadastrar mais profissionais na equipe.</p>
            </div>
          </div>
          <Link
            href="/configuracoes/plano"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 font-bold text-white transition-all hover:bg-amber-800 shadow-xs"
          >
            <Sparkles size={12} />
            Ver Planos & Upgrade
          </Link>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Equipe Clínica</h3>
          <p className="text-xs muted">
            {professionals.length} profissional{professionals.length !== 1 ? "is" : ""} cadastrado{professionals.length !== 1 ? "s" : ""} •{" "}
            <span className="font-semibold text-emerald-600">{activeCount} ativo{activeCount !== 1 ? "s" : ""}</span>
            {maxProf && (
              <span className="ml-1 text-slate-500">
                (limite de {maxProf} no Plano {subscription?.plan_tier})
              </span>
            )}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openNew}
            disabled={isLimitReached}
            className={`button button-primary !py-2 !px-4 text-xs font-semibold shadow-xs ${
              isLimitReached ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={isLimitReached ? "Limite do plano atingido" : undefined}
          >
            <Plus size={15} />
            Novo profissional
          </button>
        )}
      </div>

      {/* Tabela de Profissionais */}
      <div className={`table-wrap ${isPending ? "opacity-60" : ""}`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Profissional</th>
              <th>Conselho</th>
              <th>Contato</th>
              <th>Expediente</th>
              <th>Procedimentos</th>
              <th>Status</th>
              {isAdmin && <th className="text-right">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {professionals.map((prof) => {
              const color = prof.calendar_color ?? "#0D9488";
              const council = [prof.council_type, prof.council_number].filter(Boolean).join(" ");
              const scheduleSummary = formatScheduleSummary(prof.schedules);

              return (
                <tr key={prof.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Nome & Especialidade & Cor */}
                  <td>
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-bold text-white text-xs shadow-xs"
                        style={{ backgroundColor: color }}
                      >
                        {prof.full_name[0].toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-[var(--text-primary)]">{prof.full_name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{prof.specialty ?? "Sem especialidade"}</p>
                      </div>
                    </div>
                  </td>

                  {/* Conselho */}
                  <td>
                    {council ? (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {council}
                      </span>
                    ) : (
                      <span className="text-xs muted">—</span>
                    )}
                  </td>

                  {/* Contato */}
                  <td>
                    <div className="space-y-0.5 text-xs">
                      {prof.phone && (
                        <p className="flex items-center gap-1.5 text-slate-700">
                          <Phone size={12} className="text-slate-400" />
                          {prof.phone}
                        </p>
                      )}
                      {prof.email && (
                        <p className="flex items-center gap-1.5 text-slate-500">
                          <Mail size={12} className="text-slate-400" />
                          {prof.email}
                        </p>
                      )}
                      {!prof.phone && !prof.email && <span className="text-xs muted">—</span>}
                    </div>
                  </td>

                  {/* Expediente */}
                  <td>
                    <span className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 inline-block">
                      {scheduleSummary}
                    </span>
                  </td>

                  {/* Procedimentos */}
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Stethoscope size={13} className="text-slate-400" />
                      <span className="text-xs text-slate-700">
                        {prof.procedure_ids.length > 0 ? (
                          `${prof.procedure_ids.length} serviço${prof.procedure_ids.length > 1 ? "s" : ""}`
                        ) : (
                          <span className="muted italic">Nenhum</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Status & Toggle */}
                  <td>
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => handleToggleActive(prof)}
                      className={`inline-flex items-center gap-1 cursor-pointer transition-opacity ${
                        !isAdmin ? "cursor-default" : "hover:opacity-80"
                      }`}
                      title={isAdmin ? (prof.active ? "Clique para inativar" : "Clique para ativar") : undefined}
                    >
                      <StatusBadge status={prof.active ? "Ativo" : "Inativo"} />
                      {isAdmin && (
                        <span className="text-[10px] text-slate-400">
                          {prof.active ? <UserCheck size={12} /> : <UserX size={12} />}
                        </span>
                      )}
                    </button>
                  </td>

                  {/* Ações */}
                  {isAdmin && (
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(prof)}
                        className="button !py-1 !px-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        title="Editar profissional"
                      >
                        <Edit size={13} />
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {professionals.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="p-12 text-center text-sm muted">
                  Nenhum profissional cadastrado na clínica ainda.
                  {isAdmin && (
                    <div className="mt-3">
                      <button type="button" onClick={openNew} className="button button-primary text-xs">
                        <Plus size={14} /> Cadastrar primeiro profissional
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer Lateral */}
      <ProfessionalDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        professional={editingProf}
        allProcedures={allProcedures}
      />
    </div>
  );
}
