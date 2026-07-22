"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { appointments, professionals, type CareType } from "@/lib/mock-data";
import {
  MOCK_TODAY,
  addDays,
  isSameDay,
  isoDate,
  startOfWeek,
  weekRangeLong,
  weekRangeShort,
  weekdayLabel,
} from "@/lib/dates";
import { AppointmentDrawer } from "./appointment-drawer";
import { PageHeader } from "./page-header";
import { SummaryCard } from "./summary-card";

const slots = Array.from(
  { length: 20 },
  (_, i) =>
    `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
);

export function AgendaView() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(MOCK_TODAY));
  const [type, setType] = useState<"Todos" | CareType>("Todos");
  const [professional, setProfessional] = useState(professionals[0]);
  const [drawer, setDrawer] = useState(false);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedDate, setSelectedDate] = useState(isoDate(MOCK_TODAY));

  const weekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const filtered = useMemo(
    () =>
      appointments.filter(
        (a) =>
          (type === "Todos" || a.type === type) &&
          (professional === professionals[0] ||
            a.professional === professional),
      ),
    [type, professional],
  );

  function openDrawer(date: string, time: string) {
    setSelectedDate(date);
    setSelectedTime(time);
    setDrawer(true);
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description={weekRangeLong(weekStart)}
        action={
          <button
            className="button button-primary"
            onClick={() => openDrawer(isoDate(MOCK_TODAY), "09:00")}
          >
            <Plus size={17} />
            Novo agendamento
          </button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Consultas hoje"
          value="18"
          note="6 ainda disponíveis"
        />
        <SummaryCard label="Confirmadas" value="14" note="78% da agenda" />
        <SummaryCard label="Particular" value="11" note="R$ 2.640 previstos" />
        <SummaryCard label="Convênio" value="7" note="3 operadoras" />
      </div>
      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-3">
          <div className="flex items-center gap-2">
            <button
              className="button"
              onClick={() => setWeekStart(startOfWeek(MOCK_TODAY))}
            >
              Hoje
            </button>
            <button
              className="button !p-2"
              aria-label="Semana anterior"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="button !p-2"
              aria-label="Próxima semana"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
            >
              <ChevronRight size={17} />
            </button>
            <strong className="ml-1 text-sm">
              {weekRangeShort(weekStart)}
            </strong>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg bg-[#f1f5f7] p-1">
              {(["Todos", "Particular", "Convênio"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setType(v)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${type === v ? "bg-white text-[var(--primary)] shadow-sm" : "muted"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <select
              className="select !w-auto"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
            >
              {professionals.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-auto">
          <div className="min-w-[850px] grid grid-cols-[64px_repeat(5,1fr)]">
            <div className="h-12 border-b border-r border-[var(--border)]" />
            {weekDays.map((d) => (
              <div
                key={isoDate(d)}
                className={`grid h-12 place-items-center border-b border-r border-[var(--border)] text-xs font-semibold ${isSameDay(d, MOCK_TODAY) ? "bg-[#eef7f9] text-[var(--primary)]" : ""}`}
              >
                {weekdayLabel(d)}
              </div>
            ))}
            {slots.map((time) => (
              <div className="contents" key={time}>
                <div className="h-12 border-b border-r border-[var(--border)] pr-2 pt-1 text-right text-[10px] muted">
                  {time}
                </div>
                {weekDays.map((d) => {
                  const date = isoDate(d);
                  return (
                    <button
                      key={date}
                      className="relative h-12 border-b border-r border-[var(--border)] bg-white hover:bg-[#f3f9fa]"
                      onClick={() => openDrawer(date, time)}
                      aria-label={`Agendar ${weekdayLabel(d)} às ${time}`}
                    >
                      {d.getDay() === 4 && time === "13:00" && (
                        <span className="absolute inset-1 grid place-items-center rounded bg-[#f1f3f4] text-[10px] muted">
                          Bloqueado • almoço
                        </span>
                      )}
                      {filtered
                        .filter((a) => a.date === date && a.start === time)
                        .map((a) => (
                          <span
                            key={a.id}
                            className={`absolute inset-1 z-10 rounded border-l-[3px] p-1 text-left text-[10px] leading-tight ${a.type === "Particular" ? "border-l-[var(--private)] bg-[#eaf4f6]" : "border-l-[var(--insurance)] bg-[#f0eef8]"}`}
                          >
                            <b className="block truncate">{a.patient}</b>
                            <span className="block truncate opacity-70">
                              {a.procedure} · {a.status}
                            </span>
                          </span>
                        ))}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
      <AppointmentDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        initialDate={selectedDate}
        initialTime={selectedTime}
      />
    </>
  );
}
