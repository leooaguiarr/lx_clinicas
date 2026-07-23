"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { AppointmentDrawer, type SchedulingCatalogs } from "./appointment-drawer";
import { PageHeader } from "./page-header";
import { SummaryCard } from "./summary-card";
import { brl } from "@/lib/utils";
import type { AgendaData } from "@/lib/queries/agenda";

const SLOT_MINUTES = 30;
const FIRST_SLOT_MINUTES = 8 * 60;
const SLOT_COUNT = 20;
const ROW_HEIGHT_REM = 3;

const slots = Array.from({ length: SLOT_COUNT }, (_, index) => {
  const total = FIRST_SLOT_MINUTES + index * SLOT_MINUTES;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

const CARE_TYPE_TABS = [
  { value: "", label: "Todos" },
  { value: "private", label: "Particular" },
  { value: "insurance", label: "Convênio" },
] as const;

/** Encaixa um horário arbitrário no slot de 30 minutos que o contém. */
function slotFor(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const index = Math.floor((hour * 60 + minute - FIRST_SLOT_MINUTES) / SLOT_MINUTES);
  return index >= 0 && index < SLOT_COUNT ? slots[index] : null;
}

export function AgendaView({ data, catalogs }: { data: AgendaData; catalogs: SchedulingCatalogs }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState({ date: data.days[0].date, time: "09:00" });

  const careType = searchParams.get("tipo") ?? "";
  const professionalId = searchParams.get("profissional") ?? "";

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

  const positioned = data.appointments
    .map((item) => ({ ...item, slot: slotFor(item.start) }))
    .filter((item) => item.slot !== null);

  const blocks = data.blocks
    .map((item) => ({ ...item, slot: slotFor(item.start) }))
    .filter((item) => item.slot !== null);

  return (
    <>
      <PageHeader
        title="Agenda"
        description={`Semana de ${data.weekLabel}`}
        action={
          <button className="button button-primary" onClick={() => openDrawer(data.days[0].date, "09:00")}>
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
          <div className="min-w-[850px] grid grid-cols-[64px_repeat(5,1fr)]">
            <div className="h-12 border-b border-r border-[var(--border)]" />
            {data.days.map((day) => (
              <div
                key={day.date}
                className={`grid h-12 place-items-center border-b border-r border-[var(--border)] text-xs font-semibold ${day.isToday ? "bg-[#eef7f9] text-[var(--primary)]" : ""}`}
              >
                {day.label}
              </div>
            ))}

            {slots.map((time) => (
              <div className="contents" key={time}>
                <div className="h-12 border-b border-r border-[var(--border)] pr-2 pt-1 text-right text-[10px] muted">{time}</div>
                {data.days.map((day, dayIndex) => (
                  <button
                    key={day.date}
                    className="relative h-12 border-b border-r border-[var(--border)] bg-white hover:bg-[#f3f9fa]"
                    onClick={() => openDrawer(day.date, time)}
                    aria-label={`Agendar ${day.label} às ${time}`}
                  >
                    {blocks
                      .filter((block) => block.dayIndex === dayIndex && block.slot === time)
                      .map((block) => (
                        <span
                          key={block.id}
                          className="absolute inset-x-1 top-1 z-10 grid place-items-center rounded bg-[#f1f3f4] text-[10px] muted"
                          style={{ height: `calc(${block.slots} * ${ROW_HEIGHT_REM}rem - 0.5rem)` }}
                        >
                          Bloqueado • {block.reason}
                        </span>
                      ))}
                    {positioned
                      .filter((item) => item.dayIndex === dayIndex && item.slot === time)
                      .map((item) => (
                        <span
                          key={item.id}
                          className={`absolute inset-x-1 top-1 z-20 overflow-hidden rounded border-l-[3px] p-1 text-left text-[10px] leading-tight ${
                            item.status === "cancelled" || item.status === "no_show"
                              ? "border-l-[var(--danger)] bg-[#fdf0f1] opacity-70"
                              : item.careType === "private"
                                ? "border-l-[var(--private)] bg-[#eaf4f6]"
                                : "border-l-[var(--insurance)] bg-[#f0eef8]"
                          }`}
                          style={{ height: `calc(${item.slots} * ${ROW_HEIGHT_REM}rem - 0.5rem)` }}
                        >
                          <b className="block truncate">{item.patient}</b>
                          <span className="block truncate opacity-70">{item.procedure} · {item.statusLabel}</span>
                        </span>
                      ))}
                  </button>
                ))}
              </div>
            ))}
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
