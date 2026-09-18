"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";

export function PricingCards() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const isAnnual = billingCycle === "annual";

  const plans = [
    {
      id: "essencial",
      name: "Essencial",
      description: "Ideal para consultórios individuais e dentistas autônomos iniciarem com organização total.",
      priceMonthly: 189,
      priceAnnualMonthly: 159,
      highlight: false,
      badge: null,
      features: [
        "Até 2 profissionais cadastrados",
        "Grade de agenda dinâmica por minuto",
        "Prontuário completo com 5 abas",
        "Gestão de convênios e procedimentos",
        "Acesso para recepção e profissionais",
        "Suporte por e-mail e central de ajuda",
      ],
      ctaText: "Começar com Essencial",
      ctaHref: "https://wa.me/5535999128432?text=Ol%C3%A1%2C+gostaria+de+assinar+o+Plano+Essencial+do+Lx+Cl%C3%ADnicas",
    },
    {
      id: "profissional",
      name: "Profissional + IA",
      description: "Para clínicas que buscam reduzir faltas e colocar o agendamento no piloto automático.",
      priceMonthly: 349,
      priceAnnualMonthly: 289,
      highlight: true,
      badge: "Mais Escolhido",
      features: [
        "Até 6 profissionais cadastrados",
        "Secretária de IA no WhatsApp 24/7 (Sofia)",
        "Agendamento e remarcação autônomos",
        "Lembretes e confirmações automáticas anti-falta",
        "Módulo Financeiro completo com fluxo de caixa",
        "Relatórios de ocupação e desempenho",
        "Acessos isolados: Admin, Recepção, Dentista e Financeiro",
        "Suporte prioritário direto no WhatsApp",
      ],
      ctaText: "Assinar Profissional com IA",
      ctaHref: "https://wa.me/5535999128432?text=Ol%C3%A1%2C+gostaria+de+assinar+o+Plano+Profissional+com+IA+do+Lx+Cl%C3%ADnicas",
    },
    {
      id: "escala",
      name: "Clínica Escala",
      description: "Para clínicas consolidadas, policlínicas e redes com alto volume de atendimentos.",
      priceMonthly: 599,
      priceAnnualMonthly: 499,
      highlight: false,
      badge: "Empresarial",
      features: [
        "Profissionais e salas ilimitados",
        "Secretária com IA personalizada para o seu catálogo",
        "Tokens de API e integração com n8n/Chatwoot",
        "Múltiplas unidades e filiais sob o mesmo teto",
        "Treinamento dedicado para recepcionistas",
        "Onboarding assistido e migração de dados",
        "Gerente de conta e SLA prioritário",
      ],
      ctaText: "Falar com Especialista",
      ctaHref: "https://wa.me/5535999128432?text=Ol%C3%A1%2C+gostaria+de+conhecer+o+Plano+Cl%C3%ADnica+Escala+do+Lx+Cl%C3%ADnicas",
    },
  ];

  return (
    <div className="w-full">
      {/* Toggle de Ciclo de Faturamento */}
      <div className="flex flex-col items-center justify-center">
        <div className="inline-flex items-center rounded-xl bg-[#f1f5f9] p-1.5 border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              !isAnnual
                ? "bg-white text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Faturamento Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              isAnnual
                ? "bg-white text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Faturamento Anual
            <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold text-[#065f46]">
              Economize 20%
            </span>
          </button>
        </div>
        <p className="mt-2 text-xs muted">Cancele quando quiser • Sem taxas ocultas</p>
      </div>

      {/* Grid de Planos */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:items-stretch">
        {plans.map((plan) => {
          const price = isAnnual ? plan.priceAnnualMonthly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-7 transition-all duration-200 ${
                plan.highlight
                  ? "border-2 border-[var(--primary)] bg-white shadow-xl ring-4 ring-[var(--primary)]/10"
                  : "border border-[var(--border)] bg-white shadow-sm hover:shadow-md"
              }`}
            >
              {/* Badge de destaque */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                      plan.highlight
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "bg-[#0f172a] text-white"
                    }`}
                  >
                    {plan.highlight && <Sparkles size={13} />}
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Informações do cabeçalho do plano */}
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <p className="mt-2 min-h-[40px] text-xs leading-relaxed text-[var(--text-secondary)]">
                  {plan.description}
                </p>

                {/* Preço */}
                <div className="mt-6 flex items-baseline gap-1.5 border-b border-[var(--border)] pb-6">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">R$</span>
                  <span className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                    {price}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    /mês {isAnnual ? "(cobrado anualmente)" : ""}
                  </span>
                </div>
              </div>

              {/* Lista de Recursos */}
              <div className="mt-6 flex-1">
                <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  O que está incluso:
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#ecfdf5] text-[var(--primary)]">
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span className="text-xs sm:text-sm text-[#334155] leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botão de Ação */}
              <div className="mt-8 pt-4">
                <a
                  href={plan.ctaHref}
                  target="_blank"
                  rel="noreferrer"
                  className={`button w-full justify-center !py-3 font-semibold shadow-sm transition-all ${
                    plan.highlight
                      ? "button-primary hover:shadow-md"
                      : "!border-[var(--border)] hover:!border-[var(--primary)] hover:!text-[var(--primary)]"
                  }`}
                >
                  {plan.ctaText}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
