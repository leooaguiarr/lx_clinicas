import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Lock,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Zap,
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { PricingCards } from "@/components/pricing-cards";
import { getSessionContext } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSessionContext();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      {/* Header institucional */}
      <LandingHeader
        isAuthenticated={!!session}
        clinicName={session?.clinicName}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Glow decorativo de fundo */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-gradient-to-tr from-[var(--primary)]/15 to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/25 bg-[#ecfdf5] px-4 py-1.5 text-xs font-semibold text-[#065f46] shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
              Gestão clínica inteligente com IA no WhatsApp
            </div>

            {/* Título Principal */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-[var(--text-primary)] leading-tight sm:leading-tight">
              A gestão da sua clínica no{" "}
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-secondary)] bg-clip-text text-transparent">
                piloto automático
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
              Atendimento autônomo no WhatsApp 24/7 com inteligência artificial, grade de agenda dinâmica, prontuário com abas completas e financeiro integrado em uma única assinatura.
            </p>

            {/* Botões CTA */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <a
                href="#planos"
                className="button button-primary w-full sm:w-auto !py-3.5 !px-7 font-bold text-sm shadow-md transition-all hover:shadow-lg"
              >
                Conhecer os Planos
                <ArrowRight size={16} />
              </a>
              <Link
                href="/login"
                className="button w-full sm:w-auto !py-3.5 !px-6 font-semibold text-sm !border-[var(--border)] bg-white text-[var(--text-primary)] hover:!border-[var(--primary)] hover:!text-[var(--primary)] shadow-xs"
              >
                Área do Cliente (Entrar)
              </Link>
            </div>

            <p className="mt-3 text-xs muted">
              Sem taxa de adesão • Configuração rápida • Suporte humano especializado
            </p>
          </div>

          {/* Demonstração Visual / Mockup em Código */}
          <div className="mt-14 rounded-2xl border border-[var(--border)] bg-white p-3 sm:p-5 shadow-xl">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* Lado Esquerdo: Agenda Dinâmica */}
              <div className="rounded-xl border border-[var(--border)] bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      Agenda da Semana • Clínica Sorriso
                    </p>
                    <p className="text-[11px] muted">3 profissionais com horários disponíveis hoje</p>
                  </div>
                  <span className="badge badge-success text-[11px]">Sistema Sincronizado</span>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white p-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ecfdf5] text-xs font-bold text-[var(--primary)]">
                        09:00
                      </span>
                      <div>
                        <p className="text-sm font-bold">Lucas Mendes</p>
                        <p className="text-xs muted">Limpeza & Profilaxia • Dra. Marina</p>
                      </div>
                    </div>
                    <span className="badge badge-success text-[11px]">Confirmado</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border-2 border-[var(--primary)]/30 bg-[#f0fdfa] p-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary)] text-xs font-bold text-white">
                        14:30
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">Mariana Carvalho</p>
                          <span className="rounded bg-[var(--primary)]/15 px-1.5 py-0.2 text-[9px] font-bold text-[var(--primary)]">
                            Via IA (WhatsApp)
                          </span>
                        </div>
                        <p className="text-xs muted">Avaliação Inicial • Dra. Marina</p>
                      </div>
                    </div>
                    <span className="badge badge-success text-[11px]">Agendado pela Sofia</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white p-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f1f5f9] text-xs font-bold text-[var(--text-secondary)]">
                        16:00
                      </span>
                      <div>
                        <p className="text-sm font-bold">Rodrigo Alcantara</p>
                        <p className="text-xs muted">Restauração • Dr. Rafael Costa</p>
                      </div>
                    </div>
                    <span className="badge text-[11px]">Particular</span>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Chat da Secretária Sofia */}
              <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[#0f172a] p-4 text-white">
                <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
                  <div className="relative">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary)] text-white">
                      <Bot size={20} />
                    </span>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Sofia (Secretária IA)</p>
                    <p className="text-[10px] text-emerald-400">Ativa no WhatsApp • Resposta em 2s</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-1 flex-col space-y-3 text-xs">
                  {/* Mensagem Paciente */}
                  <div className="self-start max-w-[85%] rounded-xl rounded-tl-none bg-slate-800 p-3 text-slate-200">
                    <p className="text-[10px] text-slate-400 font-semibold mb-1">Paciente (Mariana)</p>
                    Olá! Gostaria de agendar uma avaliação com a Dra. Marina para hoje à tarde.
                  </div>

                  {/* Mensagem Sofia */}
                  <div className="self-end max-w-[85%] rounded-xl rounded-tr-none bg-[var(--primary)] p-3 text-white">
                    <p className="text-[10px] text-teal-100 font-semibold mb-1">Sofia • IA da Clínica</p>
                    Olá, Mariana! Temos horário disponível hoje às 14:30 com a Dra. Marina Lopes. Fica bom para você?
                  </div>

                  {/* Mensagem Paciente */}
                  <div className="self-start max-w-[85%] rounded-xl rounded-tl-none bg-slate-800 p-3 text-slate-200">
                    Fica perfeito, pode marcar sim!
                  </div>

                  {/* Mensagem Confirmação */}
                  <div className="self-end max-w-[85%] rounded-xl rounded-tr-none bg-emerald-700 p-3 text-white">
                    <p className="font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Agendamento Concluído!
                    </p>
                    Sua consulta está confirmada para hoje às 14:30 na Clínica Sorriso. Te enviamos o lembrete!
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-slate-800/80 p-2.5 text-center text-[11px] text-slate-300">
                  ⚡ Consulta gravada no banco com cadastro do paciente automático.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Métricas de Impacto */}
      <section className="border-y border-[var(--border)] bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-[var(--primary)] sm:text-4xl">+35%</p>
              <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                Ocupação média da agenda
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-[var(--primary)] sm:text-4xl">-60%</p>
              <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                Faltas (no-show) com lembretes
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-[var(--primary)] sm:text-4xl">24/7</p>
              <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                Atendimento ativo no WhatsApp
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-[var(--primary)] sm:text-4xl">0</p>
              <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                Conflitos de horários na grade
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Funcionalidades */}
      <section id="funcionalidades" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              Tudo o que sua clínica precisa
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Feito especificamente para a rotina odontológica e médica
            </h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Desenvolvido ouvindo dentistas, recepcionistas e gestores para garantir que cada clique poupe tempo real.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="panel p-6 transition-all hover:border-[var(--primary)] hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ecfdf5] text-[var(--primary)]">
                <Bot size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold">Secretária de IA no WhatsApp</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                A IA atende pacientes a qualquer hora do dia ou da noite, consulta a disponibilidade real e agenda sem intervenção manual.
              </p>
            </div>

            {/* Card 2 */}
            <div className="panel p-6 transition-all hover:border-[var(--primary)] hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef2ff] text-[var(--insurance)]">
                <CalendarCheck2 size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold">Grade Dinâmica por Minuto</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                A agenda se adapta ao expediente dos profissionais, sem esconder atendimentos de fim de semana ou horários especiais.
              </p>
            </div>

            {/* Card 3 */}
            <div className="panel p-6 transition-all hover:border-[var(--primary)] hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f0fdf4] text-emerald-600">
                <Users size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold">Prontuário com 5 Abas</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                Ficha completa do paciente: Resumo de dados, Agendamentos, Histórico financeiro, Documentos e Linha do Tempo clínica.
              </p>
            </div>

            {/* Card 4 */}
            <div className="panel p-6 transition-all hover:border-[var(--primary)] hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#fef2f2] text-[var(--danger)]">
                <CreditCard size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold">Controle Financeiro & Fluxo</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                Visão imediata do faturamento do mês, saldo em aberto, inadimplência e separação de consultas por convênio ou particular.
              </p>
            </div>

            {/* Card 5 */}
            <div className="panel p-6 transition-all hover:border-[var(--primary)] hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#fefce8] text-amber-600">
                <Lock size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold">Multiempresa & Papéis</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                Políticas rígidas de segurança para Administradores, Dentistas, Recepção e Financeiro. Dentistas não veem o financeiro global.
              </p>
            </div>

            {/* Card 6 */}
            <div className="panel p-6 transition-all hover:border-[var(--primary)] hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f1f5f9] text-[#475569]">
                <Zap size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold">Conexão Aberta via API</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                Endpoints REST seguros e tokens individuais por clínica para integrar com n8n, Chatwoot, Evolution API ou sistemas internos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Planos de Assinatura */}
      <section id="planos" className="bg-[#f8fafc] py-20 border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              Planos & Assinaturas
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Preços justos, transparentes e sem surpresas
            </h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Escolha o plano ideal para a sua estrutura. Todos os planos contam com atualizações contínuas e suporte técnico.
            </p>
          </div>

          <div className="mt-12">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* Seção FAQ */}
      <section id="faq" className="py-20 border-t border-[var(--border)] bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              Tire suas dúvidas
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Perguntas Frequentes</h2>
          </div>

          <div className="mt-12 space-y-4">
            <div className="panel p-5">
              <h3 className="font-bold text-base">Como funciona a secretária com inteligência artificial?</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                A secretária (Sofia) é conectada ao WhatsApp da sua clínica através da nossa API. Quando um paciente envia mensagem, ela entende a intenção, consulta a grade de horários disponíveis dos seus dentistas em tempo real e realiza o agendamento de forma natural e humanizada.
              </p>
            </div>

            <div className="panel p-5">
              <h3 className="font-bold text-base">O sistema precisa ser instalado no computador?</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                Não! O Lx Clínicas é 100% em nuvem. Você e sua equipe podem acessar pelo navegador no computador, tablet ou celular, em qualquer lugar e a qualquer hora.
              </p>
            </div>

            <div className="panel p-5">
              <h3 className="font-bold text-base">Como funciona a Área do Cliente?</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                Ao contratar a plataforma, você recebe as credenciais de acesso seguro. Clicando no botão "Área do Cliente" no topo do site, você entra no seu painel com isolamento completo dos dados da sua clínica.
              </p>
            </div>

            <div className="panel p-5">
              <h3 className="font-bold text-base">Posso cancelar ou mudar de plano a qualquer momento?</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                Sim. Não exigimos contratos de fidelidade para faturamentos mensais. Você pode realizar o upgrade ou cancelamento da sua assinatura de forma simples e transparente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] py-16 text-white text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para transformar o atendimento da sua clínica?
          </h2>
          <p className="mt-4 text-sm text-slate-300">
            Junte-se às clínicas que já automatizaram a recepção com a tecnologia do Lx Clínicas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#planos"
              className="button button-primary !py-3.5 !px-8 font-bold text-sm shadow-md"
            >
              Escolher um Plano
              <ArrowRight size={16} />
            </a>
            <Link
              href="/login"
              className="button !border-slate-700 bg-slate-800 text-white hover:bg-slate-700 !py-3.5 !px-6 text-sm font-semibold"
            >
              Acessar Área do Cliente
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary)] text-white">
                <Stethoscope size={16} />
              </span>
              <span className="text-base font-bold text-[var(--text-primary)]">Lx Clínicas</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
              <a href="#funcionalidades" className="hover:text-[var(--primary)]">
                Funcionalidades
              </a>
              <a href="#planos" className="hover:text-[var(--primary)]">
                Planos
              </a>
              <Link href="/login" className="font-semibold hover:text-[var(--primary)]">
                Área do Cliente
              </Link>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              © {new Date().getFullYear()} Lx Clínicas. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
