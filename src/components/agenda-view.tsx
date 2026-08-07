"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { AppointmentDrawer, type SchedulingCatalogs } from "./appointment-drawer";
import { PageHeader } from "./page-header";
import { SummaryCard } from "./summary-card";
import { brl } from "@/lib/utils";
import type { AgendaData } from "@/lib/queries/agenda";

/** Altura de uma linha da grade, em rem. Tudo é posicionado em múltiplos dela. */
const ROW_HEIGHT_REM = 3;
/** Largura mínima de uma coluna de dia — abaixo disso a grade rola na horizontal. */
const MIN_DAY_WIDTH = 150;
const GUTTER_WIDTH = 64;

const CARE_TYPE_TABS = [
  { value: "", label: "Todos" },
  { value: "private", label: "Particular" },
  { value: "insurance", label: "Convênio" },
] as const;

export function AgendaView({ data, catalogs }: { data: AgendaData; catalogs: SchedulingCatalogs }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState({ date: data.days[0].date, time: data.grid.slots[0] });

  const careType = searchParams.get("tipo") ?? "";
  const professionalId = searchParams.get("profissional") ?? "";

  const { grid, days } = data;
  const columns = `${GUTTER_WIDTH}px repeat(${days.length}, minmax(0, 1fr))`;
  const minWidth = GUTTER_WIDTH + days.length * MIN_DAY_WIDTH;

  /** Posição vertical de um horário, em rem, relativa ao topo da grade. */
  const offsetRem = (startMinutes: number) =>
    ((startMinutes - grid.startMinutes) / grid.slotMinutes) * ROW_HEIGHT_REM;

  function setParam(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => router.push(`/agenda?${params.toString()}`, { scroll: false }));
  }

  function openDrawer(date: string, time: string) {
    setSelected({ date, time });
    setDrawer(true);
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description={`Semana de ${data.weekLabel}`}
        action={
          <button className="button button-primary" onClick={() => openDrawer(days[0].date, grid.slots[0])}>
            <Plus size={17} />
            Novo agendamento
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Consultas hoje" value={String(data.summary.todayTotal)} note="na semana exibida" />
        <SummaryCard label="Confirmadas" value={String(data.summary.confirmed)} note={`${data.summary.confirmedShare}% da agenda de hoje`} />
        <SummaryCard label="Particular" value={String(data.summary.privateCount)} note={`${brl(data.summary.privateValue)} previstos`} />
        <SummaryCard label="Convênio" value={String(data.summary.insuranceCount)} note={`${data.summary.insuranceCompanies} operadoras`} />
      </div>

      <section className={`panel overflow-hidden ${isPending ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-3">
          <div className="flex items-center gap-2">
            <button className="button" onClick={() => setParam({ semana: "" })}>Hoje</button>
            <button className="button !p-2" aria-label="Semana anterior" onClick={() => setParam({ semana: String(data.weekOffset - 1) })}>
              <ChevronLeft size={17} />
            </button>
            <button className="button !p-2" aria-label="Próxima semana" onClick={() => setParam({ semana: String(data.weekOffset + 1) })}>
              <ChevronRight size={17} />
            </button>
            <strong className="ml-1 text-sm">{data.weekLabel}</strong>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg bg-[#f1f5f7] p-1">
              {CARE_TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setParam({ tipo: tab.value })}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${careType === tab.value ? "bg-white text-[var(--primary)] shadow-sm" : "muted"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <select className="select !w-auto" value={professionalId} onChange={(event) => setParam({ profissional: event.target.value })}>
              <option value="">Todos os profissionais</option>
              {data.professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>{professional.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-auto">
          <div style={{ minWidth }}>
            <div className="grid" style={{ gridTemplateColumns: columns }}>
              <div className="h-12 border-b border-r border-[var(--border)]" />
              {days.map((day) => (
                <div
                  key={day.date}
                  className={`grid h-12 place-items-center border-b border-r border-[var(--border)] text-xs font-semibold ${day.isToday ? "bg-[#eef7f9] text-[var(--primary)]" : ""}`}
                >
                  {day.label}
                </div>
              ))}
            </div>

            <div className="relative">
              {/* Fundo: linhas da grade e alvos de clique para abrir o formulário. */}
              <div className="grid" style={{ gridTemplateColumns: columns }}>
                {grid.slots.map((time) => (
                  <div className="contents" key={time}>
                    <div
                      className="border-b border-r border-[var(--border)] pr-2 pt-1 text-right text-[10px] muted"
                      style={{ height: `${ROW_HEIGHT_REM}rem` }}
                    >
                      {time}
                    </div>
                    {days.map((day) => (
                      <button
                        key={day.date}
                        className="border-b border-r border-[var(--border)] bg-white hover:bg-[#f3f9fa]"
                        style={{ height: `${ROW_HEIGHT_REM}rem` }}
                        onClick={() => openDrawer(day.date, time)}
                        aria-label={`Agendar ${day.label} às ${time}`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/*
                Camada dos atendimentos, sobreposta à grade e alinhada nas mesmas
                colunas. Posicionar por minuto (e não por célula) faz um horário
                quebrado como 08:20 aparecer no lugar certo, em vez de sumir.
              */}
              <div
                className="pointer-events-none absolute inset-0 grid"
                style={{ gridTemplateColumns: columns }}
                aria-hidden
              >
                <div />
                {days.map((day, dayIndex) => (
                  <div className="relative" key={day.date}>
                    {data.blocks
                      .filter((block) => block.dayIndex === dayIndex)
                      .map((block) => (
                        <span
                          key={block.id}
                          className="absolute inset-x-1 z-10 grid place-items-center overflow-hidden rounded bg-[#f1f3f4] text-[10px] muted"
                          style={{
                            top: `calc(${offsetRem(block.startMinutes)}rem + 0.25rem)`,
                            height: `calc(${(block.durationMinutes / grid.slotMinutes) * ROW_HEIGHT_REM}rem - 0.5rem)`,
                          }}
                        >
                          Bloqueado • {block.reason}
                        </span>
                      ))}
                    {data.appointments
                      .filter((item) => item.dayIndex === dayIndex)
                      .map((item) => (
                        <span
                          key={item.id}
                          className={`absolute z-20 overflow-hidden rounded border-l-[3px] p-1 text-left text-[10px] leading-tight ${
                            item.status === "cancelled" || item.status === "no_show"
                              ? "border-l-[var(--danger)] bg-[#fdf0f1] opacity-70"
                              : item.careType === "private"
                                ? "border-l-[var(--private)] bg-[#eaf4f6]"
                                : "border-l-[var(--insurance)] bg-[#f0eef8]"
                          }`}
                          style={{
                            top: `calc(${offsetRem(item.startMinutes)}rem + 0.25rem)`,
                            height: `calc(${(item.durationMinutes / grid.slotMinutes) * ROW_HEIGHT_REM}rem - 0.5rem)`,
                            left: `calc(${(item.column / item.columnCount) * 100}% + 0.25rem)`,
                            width: `calc(${100 / item.columnCount}% - 0.5rem)`,
                          }}
                        >
                          <b className="block truncate">{item.start} {item.patient}</b>
                          <span className="block truncate opacity-70">{item.procedure} · {item.statusLabel}</span>
                        </span>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AppointmentDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        catalogs={catalogs}
        initialDate={selected.date}
        initialTime={selected.time}
      />
    </>
  );
}
