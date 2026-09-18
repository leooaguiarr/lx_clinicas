"use client";

import { Bot, Check, Clock, Sparkles, Stethoscope, Users, Zap } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSubscriptionPlan } from "@/lib/actions/settings";
import type { ClinicSubscriptionRow, PlanTier } from "@/types/database";

const PLAN_INFO = {
  essencial: {
    name: "Essencial",
    price: "R$ 189",
    maxProf: 2,
    hasAi: false,
    tag: "Consultórios Individuais",
    color: "var(--primary)",
  },
  profissional: {
    name: "Profissional + IA",
    price: "R$ 349",
    maxProf: 6,
    hasAi: true,
    tag: "Mais Popular",
    color: "var(--primary)",
  },
  escala: {
    name: "Clínica Escala",
    price: "R$ 599",
    maxProf: null,
    hasAi: true,
    tag: "Equipes e Redes",
    color: "#0F172A",
  },
};

export function SubscriptionSection({
  subscription,
  activeProfessionalsCount,
  isAdmin,
}: {
  subscription: ClinicSubscriptionRow | null;
  activeProfessionalsCount: number;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const planKey: PlanTier = subscription?.plan_tier ?? "profissional";
  const currentPlan = PLAN_INFO[planKey];
  const maxProf = subscription?.max_professionals ?? currentPlan.maxProf;
  const isTrial = subscription?.status === "trial";
  const hasAi = subscription?.ai_agent_enabled ?? currentPlan.hasAi;

  const profPercent = maxProf ? Math.min(Math.round((activeProfessionalsCount / maxProf) * 100), 100) : 20;

  function handleChangePlan(newPlan: PlanTier) {
    if (!isAdmin) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateSubscriptionPlan(newPlan, subscription?.billing_cycle ?? "monthly");
      if (res.error) {
        setFeedback(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Banner de Status do Plano Atual */}
      <div className="rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-white to-[#f0fdfa] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#065f46] border border-[var(--primary)]/20">
                Plano {currentPlan.name}
              </span>
              {isTrial && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                  Período de Testes (Trial)
                </span>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--text-primary)]">
              Assinatura da Clínica
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {isTrial
                ? "Sua clínica está aproveitando o período de testes com todas as funcionalidades liberadas."
                : "Sua assinatura está ativa e regularizada."}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-black text-[var(--text-primary)]">{currentPlan.price}<span className="text-xs font-normal text-slate-400">/mês</span></p>
            <p className="text-[11px] text-slate-400">Cobrança via Asaas</p>
          </div>
        </div>

        {/* Medidores de Recursos */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3 border-t border-[var(--border)] pt-5">
          {/* Cota de Profissionais */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                <Users size={14} className="text-[var(--primary)]" />
                Profissionais
              </span>
              <span className="font-semibold text-slate-600">
                {activeProfessionalsCount} / {maxProf ? `${maxProf} ativos` : "Ilimitado"}
              </span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all duration-500 ${
                  maxProf && activeProfessionalsCount >= maxProf
                    ? "bg-rose-500"
                    : profPercent >= 80
                    ? "bg-amber-500"
                    : "bg-[var(--primary)]"
                }`}
                style={{ width: `${maxProf ? profPercent : 30}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] muted">
              {maxProf
                ? `${Math.max(0, maxProf - activeProfessionalsCount)} vaga(s) disponível(is) no seu plano`
                : "Sem limite de profissionais"}
            </p>
          </div>

          {/* Secretária IA */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                <Bot size={14} className="text-[var(--primary)]" />
                Secretária Sofia (IA)
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  hasAi ? "bg-[#ecfdf5] text-[#065f46]" : "bg-slate-100 text-slate-500"
                }`}
              >
                {hasAi ? "Ativa 24/7" : "Inativa"}
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-700">
              {hasAi ? "Atendimento autônomo no WhatsApp ligado" : "Exclusivo nos planos com IA"}
            </p>
            <p className="mt-1 text-[11px] muted">
              {hasAi ? "Agendamento direto sem intervenção humana" : "Faça upgrade para ativar"}
            </p>
          </div>

          {/* Prontuário e Gestão */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                <Stethoscope size={14} className="text-[var(--primary)]" />
                Prontuário & Agenda
              </span>
              <span className="rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#065f46]">
                Liberado
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-700">5 abas completas do paciente</p>
            <p className="mt-1 text-[11px] muted">Grade dinâmica e controle financeiro inclusos</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {feedback}
        </div>
      )}

      {/* Seção de Troca de Plano / Simulação de Testes */}
      <div className="panel p-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Simulador de Planos & Testes
            </h3>
            <p className="text-xs muted">
              Alterne de plano com 1 clique para testar as travas de cota e funcionalidades de cada categoria.
            </p>
          </div>
          {isPending && <span className="text-xs font-semibold text-[var(--primary)] animate-pulse">Atualizando plano…</span>}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* Card Essencial */}
          <div
            className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
              planKey === "essencial"
                ? "border-2 border-[var(--primary)] bg-[#f0fdfa]/40 shadow-sm"
                : "border-[var(--border)] bg-white hover:border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Individual</span>
                {planKey === "essencial" && (
                  <span className="badge badge-success text-[10px]">Plano Atual</span>
                )}
              </div>
              <h4 className="mt-2 text-lg font-bold">Essencial</h4>
              <p className="mt-1 text-2xl font-black">R$ 189<span className="text-xs font-normal text-slate-400">/mês</span></p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[var(--primary)]" /> Até 2 profissionais ativos</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[var(--primary)]" /> Grade de agenda dinâmica</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[var(--primary)]" /> Prontuário com 5 abas</li>
                <li className="flex items-center gap-1.5 text-slate-400"><X size={13} /> Sem secretária de IA no WhatsApp</li>
              </ul>
            </div>
            <div className="mt-6">
              <button
                type="button"
                disabled={isPending || planKey === "essencial" || !isAdmin}
                onClick={() => handleChangePlan("essencial")}
                className={`button w-full justify-center !py-2 text-xs font-semibold ${
                  planKey === "essencial" ? "opacity-50 cursor-not-allowed" : "button-primary"
                }`}
              >
                {planKey === "essencial" ? "Plano Atual" : "Testar Essencial (2 Profissionais)"}
              </button>
            </div>
          </div>

          {/* Card Profissional + IA */}
          <div
            className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all ${
              planKey === "profissional"
                ? "border-2 border-[var(--primary)] bg-[#f0fdfa]/40 shadow-sm ring-2 ring-[var(--primary)]/10"
                : "border-[var(--border)] bg-white hover:border-slate-300"
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1 rounded-full bg-[var(--primary)] px-3 py-0.5 text-[10px] font-bold text-white uppercase shadow-xs">
                <Sparkles size={11} /> Mais Escolhido
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--primary)] uppercase">Clínica Inteligente</span>
                {planKey === "profissional" && (
                  <span className="badge badge-success text-[10px]">Plano Atual</span>
                )}
              </div>
              <h4 className="mt-2 text-lg font-bold">Profissional + IA</h4>
              <p className="mt-1 text-2xl font-black">R$ 349<span className="text-xs font-normal text-slate-400">/mês</span></p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]"><Check size={13} className="text-[var(--primary)]" /> Até 6 profissionais ativos</li>
                <li className="flex items-center gap-1.5 font-semibold text-emerald-700"><Check size={13} className="text-emerald-600" /> Secretária Sofia no WhatsApp 24/7</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[var(--primary)]" /> Lembretes automáticos anti-falta</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[var(--primary)]" /> Módulo financeiro & relatórios</li>
              </ul>
            </div>
            <div className="mt-6">
              <button
                type="button"
                disabled={isPending || planKey === "profissional" || !isAdmin}
                onClick={() => handleChangePlan("profissional")}
                className={`button w-full justify-center !py-2 text-xs font-semibold ${
                  planKey === "profissional" ? "opacity-50 cursor-not-allowed" : "button-primary"
                }`}
              >
                {planKey === "profissional" ? "Plano Atual" : "Testar Profissional (6 Profissionais + IA)"}
              </button>
            </div>
          </div>

          {/* Card Clínica Escala */}
          <div
            className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
              planKey === "escala"
                ? "border-2 border-[var(--primary)] bg-[#f0fdfa]/40 shadow-sm"
                : "border-[var(--border)] bg-white hover:border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Empresarial</span>
                {planKey === "escala" && (
                  <span className="badge badge-success text-[10px]">Plano Atual</span>
                )}
              </div>
              <h4 className="mt-2 text-lg font-bold">Clínica Escala</h4>
              <p className="mt-1 text-2xl font-black">R$ 599<span className="text-xs font-normal text-slate-400">/mês</span></p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]"><Check size={13} className="text-[var(--primary)]" /> Profissionais e salas ilimitados</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[var(--primary)]" /> IA personalizada com catálogo próprio</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[var(--primary)]" /> Múltiplas filiais sob mesmo painel</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[var(--primary)]" /> Suporte e onboarding dedicado</li>
              </ul>
            </div>
            <div className="mt-6">
              <button
                type="button"
                disabled={isPending || planKey === "escala" || !isAdmin}
                onClick={() => handleChangePlan("escala")}
                className={`button w-full justify-center !py-2 text-xs font-semibold ${
                  planKey === "escala" ? "opacity-50 cursor-not-allowed" : "button-primary"
                }`}
              >
                {planKey === "escala" ? "Plano Atual" : "Testar Escala (Ilimitado)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
