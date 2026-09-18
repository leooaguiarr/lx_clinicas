"use client";

import { Check, Clock, Stethoscope, User, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { saveProfessional, type ProfessionalFormState } from "@/lib/actions/settings";
import type { ProfessionalDetail } from "@/lib/queries/settings";

const PRESET_COLORS = [
  { name: "Teal Clínico", hex: "#0D9488" },
  { name: "Azul Oceano", hex: "#2563EB" },
  { name: "Índigo", hex: "#4F46E5" },
  { name: "Violeta", hex: "#7C3AED" },
  { name: "Rosa Saúde", hex: "#DB2777" },
  { name: "Âmbar", hex: "#D97706" },
  { name: "Esmeralda", hex: "#059669" },
  { name: "Ciano", hex: "#0891B2" },
  { name: "Grafite", hex: "#475569" },
];

const WEEKDAYS = [
  { day: 1, name: "Segunda-feira", short: "Seg" },
  { day: 2, name: "Terça-feira", short: "Ter" },
  { day: 3, name: "Quarta-feira", short: "Qua" },
  { day: 4, name: "Quinta-feira", short: "Qui" },
  { day: 5, name: "Sexta-feira", short: "Sex" },
  { day: 6, name: "Sábado", short: "Sáb" },
  { day: 0, name: "Domingo", short: "Dom" },
];

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary !py-2.5 !px-6 text-sm font-semibold" type="submit" disabled={pending}>
      {pending ? "Salvando…" : isEditing ? "Salvar alterações" : "Cadastrar profissional"}
    </button>
  );
}

export function ProfessionalDrawer({
  open,
  onClose,
  professional,
  allProcedures,
}: {
  open: boolean;
  onClose: () => void;
  professional?: ProfessionalDetail | null;
  allProcedures: { id: string; name: string; category: string | null; default_duration_minutes: number }[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<ProfessionalFormState, FormData>(saveProfessional, {});
  const isEditing = Boolean(professional?.id);

  // Estados locais para tabs
  const [tab, setTab] = useState<"dados" | "horarios" | "procedimentos">("dados");

  // Estado da cor
  const [selectedColor, setSelectedColor] = useState<string>(
    professional?.calendar_color ?? "#0D9488",
  );

  // Estado dos procedimentos vinculados
  const [selectedProcedures, setSelectedProcedures] = useState<Set<string>>(
    new Set(professional?.procedure_ids ?? allProcedures.map((p) => p.id)),
  );

  // Estado dos horários semanais
  type DayScheduleState = {
    active: boolean;
    start: string;
    end: string;
    interval: number;
  };

  const initialSchedules: Record<number, DayScheduleState> = {};
  for (let w = 0; w <= 6; w++) {
    const existing = professional?.schedules?.find((s) => s.weekday === w);
    if (existing) {
      initialSchedules[w] = {
        active: existing.active,
        start: existing.start_time.slice(0, 5),
        end: existing.end_time.slice(0, 5),
        interval: existing.appointment_interval_minutes,
      };
    } else {
      // Default: Seg-Sex ativo das 08:00 às 18:00, Sáb/Dom inativo
      const isWeekday = w >= 1 && w <= 5;
      initialSchedules[w] = {
        active: isWeekday,
        start: "08:00",
        end: "18:00",
        interval: 30,
      };
    }
  }

  const [schedules, setSchedules] = useState<Record<number, DayScheduleState>>(initialSchedules);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  // Atualiza estados quando o profissional selecionado muda
  useEffect(() => {
    setSelectedColor(professional?.calendar_color ?? "#0D9488");
    setSelectedProcedures(new Set(professional?.procedure_ids ?? allProcedures.map((p) => p.id)));
    setTab("dados");

    const newSched: Record<number, DayScheduleState> = {};
    for (let w = 0; w <= 6; w++) {
      const existing = professional?.schedules?.find((s) => s.weekday === w);
      if (existing) {
        newSched[w] = {
          active: existing.active,
          start: existing.start_time.slice(0, 5),
          end: existing.end_time.slice(0, 5),
          interval: existing.appointment_interval_minutes,
        };
      } else {
        const isWeekday = w >= 1 && w <= 5;
        newSched[w] = {
          active: isWeekday,
          start: "08:00",
          end: "18:00",
          interval: 30,
        };
      }
    }
    setSchedules(newSched);
  }, [professional, allProcedures]);

  if (!open) return null;

  function toggleProcedure(id: string) {
    const next = new Set(selectedProcedures);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProcedures(next);
  }

  function toggleAllProcedures() {
    if (selectedProcedures.size === allProcedures.length) {
      setSelectedProcedures(new Set());
    } else {
      setSelectedProcedures(new Set(allProcedures.map((p) => p.id)));
    }
  }

  function applyCommercialHours() {
    setSchedules((prev) => {
      const updated = { ...prev };
      for (let w = 1; w <= 5; w++) {
        updated[w] = { active: true, start: "08:00", end: "18:00", interval: 30 };
      }
      updated[6] = { active: true, start: "08:00", end: "12:00", interval: 30 };
      updated[0] = { active: false, start: "08:00", end: "18:00", interval: 30 };
      return updated;
    });
  }

  return (
    <>
      <button className="fixed inset-0 z-40 bg-[#172b3a]/30 backdrop-blur-xs" onClick={onClose} aria-label="Fechar drawer" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prof-drawer-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[620px] flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-white font-bold shadow-xs"
              style={{ backgroundColor: selectedColor }}
            >
              {professional?.full_name ? professional.full_name[0].toUpperCase() : <User size={20} />}
            </span>
            <div>
              <h2 id="prof-drawer-title" className="text-lg font-bold text-[var(--text-primary)]">
                {isEditing ? `Editar: ${professional?.full_name}` : "Novo profissional"}
              </h2>
              <p className="text-xs muted">
                {isEditing ? "Altere os dados, horários e procedimentos" : "Cadastre o profissional e sua disponibilidade"}
              </p>
            </div>
          </div>
          <button className="button !p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        {/* Tabs */}
        <nav className="flex border-b border-[var(--border)] bg-[#f8fafc] px-6">
          <button
            type="button"
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition-all ${
              tab === "dados"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            onClick={() => setTab("dados")}
          >
            <User size={15} />
            Identificação
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition-all ${
              tab === "horarios"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            onClick={() => setTab("horarios")}
          >
            <Clock size={15} />
            Expediente & Horários
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition-all ${
              tab === "procedimentos"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            onClick={() => setTab("procedimentos")}
          >
            <Stethoscope size={15} />
            Procedimentos ({selectedProcedures.size})
          </button>
        </nav>

        {/* Form Body */}
        <form className="flex flex-1 flex-col overflow-hidden" action={formAction}>
          <input type="hidden" name="id" value={professional?.id ?? ""} />
          <input type="hidden" name="calendarColor" value={selectedColor} />
          {Array.from(selectedProcedures).map((procId) => (
            <input key={procId} type="hidden" name="procedureIds" value={procId} />
          ))}

          {/* Hidden inputs para os horários */}
          {WEEKDAYS.map(({ day }) => {
            const sched = schedules[day] ?? { active: false, start: "08:00", end: "18:00", interval: 30 };
            return (
              <div key={day} className="hidden">
                <input type="hidden" name={`schedule_${day}_active`} value={sched.active ? "true" : "false"} />
                <input type="hidden" name={`schedule_${day}_start`} value={sched.start} />
                <input type="hidden" name={`schedule_${day}_end`} value={sched.end} />
                <input type="hidden" name={`schedule_${day}_interval`} value={sched.interval} />
              </div>
            );
          })}

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {state.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {state.error}
              </div>
            )}

            {/* TAB 1: DADOS */}
            {tab === "dados" && (
              <div className="space-y-4">
                <label className="label">
                  Nome completo *
                  <input
                    className="input"
                    name="fullName"
                    required
                    minLength={3}
                    defaultValue={professional?.full_name ?? ""}
                    placeholder="Ex: Dra. Mariana Lopes"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="label">
                    Especialidade principal
                    <input
                      className="input"
                      name="specialty"
                      defaultValue={professional?.specialty ?? ""}
                      placeholder="Ex: Ortodontia / Clínico Geral"
                    />
                  </label>
                  <label className="label">
                    Status no sistema
                    <select className="select" name="active" defaultValue={professional?.active !== false ? "true" : "false"}>
                      <option value="true">Ativo na clínica</option>
                      <option value="false">Inativo (não recebe consultas)</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="label">
                    Conselho (Tipo)
                    <input
                      className="input"
                      name="councilType"
                      defaultValue={professional?.council_type ?? "CRO"}
                      placeholder="CRO, CRM, etc."
                    />
                  </label>
                  <label className="label">
                    Número do Registro
                    <input
                      className="input"
                      name="councilNumber"
                      defaultValue={professional?.council_number ?? ""}
                      placeholder="Ex: 12345/MG"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="label">
                    Telefone / WhatsApp
                    <input
                      className="input"
                      name="phone"
                      defaultValue={professional?.phone ?? ""}
                      placeholder="(35) 99999-0000"
                    />
                  </label>
                  <label className="label">
                    E-mail
                    <input
                      type="email"
                      className="input"
                      name="email"
                      defaultValue={professional?.email ?? ""}
                      placeholder="doutor@clinica.com"
                    />
                  </label>
                </div>

                {/* Seletor de Cor na Agenda */}
                <div>
                  <label className="label mb-2">Cor de identificação na Agenda</label>
                  <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[#f8fafc] p-3">
                    {PRESET_COLORS.map((c) => {
                      const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.name}
                          onClick={() => setSelectedColor(c.hex)}
                          className={`relative grid h-8 w-8 place-items-center rounded-full transition-transform ${
                            isSelected ? "scale-110 ring-2 ring-offset-2 ring-slate-700" : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {isSelected && <Check size={14} className="text-white drop-shadow-xs" />}
                        </button>
                      );
                    })}
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs muted font-mono">{selectedColor}</span>
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                        title="Cor personalizada"
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] muted">
                    Esta cor identifica visualmente as consultas deste profissional na grade semanal.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: HORÁRIOS & EXPEDIENTE */}
            {tab === "horarios" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#ecfdf5] p-3 border border-[var(--primary)]/20">
                  <div className="text-xs text-[#065f46]">
                    <p className="font-bold">Grade de atendimento inteligente</p>
                    <p className="text-[11px]">A agenda e a secretária Sofia só agendam consultas nos horários ativos.</p>
                  </div>
                  <button
                    type="button"
                    onClick={applyCommercialHours}
                    className="button !py-1 !px-2.5 text-xs font-semibold bg-white border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-white/80"
                  >
                    Preencher Seg-Sex (08h às 18h)
                  </button>
                </div>

                <div className="space-y-2.5">
                  {WEEKDAYS.map(({ day, name }) => {
                    const sched = schedules[day] ?? { active: false, start: "08:00", end: "18:00", interval: 30 };
                    return (
                      <div
                        key={day}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                          sched.active ? "border-[var(--border)] bg-white shadow-xs" : "border-slate-200 bg-slate-50 opacity-60"
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-xs sm:w-36">
                          <input
                            type="checkbox"
                            checked={sched.active}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSchedules((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], active: checked },
                              }));
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                          <span className={sched.active ? "text-[var(--text-primary)]" : "text-slate-500"}>
                            {name}
                          </span>
                        </label>

                        {sched.active ? (
                          <div className="flex items-center gap-2 text-xs">
                            <input
                              type="time"
                              value={sched.start}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSchedules((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day], start: val },
                                }));
                              }}
                              className="input !py-1 !px-2 text-xs !w-24"
                            />
                            <span className="text-slate-400">até</span>
                            <input
                              type="time"
                              value={sched.end}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSchedules((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day], end: val },
                                }));
                              }}
                              className="input !py-1 !px-2 text-xs !w-24"
                            />
                            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                              <select
                                value={sched.interval}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSchedules((prev) => ({
                                    ...prev,
                                    [day]: { ...prev[day], interval: val },
                                  }));
                                }}
                                className="select !py-1 !px-2 text-xs !w-20"
                                title="Intervalo padrão entre consultas"
                              >
                                <option value={15}>15m</option>
                                <option value={20}>20m</option>
                                <option value={30}>30m</option>
                                <option value={45}>45m</option>
                                <option value={60}>60m</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Folga / Sem atendimento</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PROCEDIMENTOS */}
            {tab === "procedimentos" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">Procedimentos atendidos</p>
                    <p className="text-[11px] muted">Selecione quais serviços este profissional está habilitado a realizar.</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAllProcedures}
                    className="button !py-1 !px-3 text-xs font-semibold"
                  >
                    {selectedProcedures.size === allProcedures.length ? "Desmarcar todos" : "Selecionar todos"}
                  </button>
                </div>

                {allProcedures.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs muted">
                    Nenhum procedimento cadastrado na clínica. Cadastre procedimentos na aba &quot;Procedimentos&quot;.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {allProcedures.map((proc) => {
                      const isSelected = selectedProcedures.has(proc.id);
                      return (
                        <div
                          key={proc.id}
                          onClick={() => toggleProcedure(proc.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-[var(--primary)] bg-[#f0fdfa] text-[var(--text-primary)] shadow-xs"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`grid h-5 w-5 place-items-center rounded border ${
                                isSelected
                                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check size={13} />}
                            </span>
                            <div>
                              <p className="text-xs font-bold leading-tight">{proc.name}</p>
                              <p className="text-[10px] muted">
                                {proc.category ?? "Geral"} • {proc.default_duration_minutes} min
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <footer className="sticky bottom-0 flex items-center justify-between border-t border-[var(--border)] bg-[#f8fafc] px-6 py-4">
            <button
              type="button"
              className="button text-xs font-semibold !border-slate-300"
              onClick={onClose}
            >
              Cancelar
            </button>
            <SubmitButton isEditing={isEditing} />
          </footer>
        </form>
      </aside>
    </>
  );
}
