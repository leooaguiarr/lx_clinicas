/**
 * Cálculo da grade da agenda: qual janela de horários exibir e como distribuir
 * atendimentos que se sobrepõem.
 *
 * Fica separado das queries por não depender de nada — nem de Supabase, nem de
 * fuso — o que permite exercitar os casos de borda diretamente.
 */

export const SLOT_MINUTES = 30;
/** Usada quando a clínica ainda não tem expediente cadastrado nem nada marcado. */
const FALLBACK_START = 8 * 60;
const FALLBACK_END = 18 * 60;

export type AgendaGrid = {
  /** Minutos desde a meia-noite da primeira linha. */
  startMinutes: number;
  slotMinutes: number;
  /** Rótulos das linhas: ["08:00", "08:30", ...]. */
  slots: string[];
};

export type Span = { startMinutes: number; durationMinutes: number };

/** "08:30" ou "08:30:00" → 510. */
export function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/** 510 → "08:30". */
export function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * Janela que a grade precisa cobrir: o expediente cadastrado, esticado por
 * qualquer agendamento ou bloqueio que caia fora dele.
 *
 * A grade era fixa em 08:00–18:00 e o que sobrava era descartado em silêncio —
 * um atendimento marcado às 19h simplesmente não existia na tela.
 */
export function gridWindow(schedules: { start_time: string; end_time: string }[], spans: Span[]): AgendaGrid {
  const starts: number[] = [];
  const ends: number[] = [];

  for (const schedule of schedules) {
    starts.push(toMinutes(schedule.start_time));
    ends.push(toMinutes(schedule.end_time));
  }
  for (const span of spans) {
    starts.push(span.startMinutes);
    ends.push(span.startMinutes + span.durationMinutes);
  }

  const first = starts.length ? Math.min(...starts) : FALLBACK_START;
  const last = ends.length ? Math.max(...ends) : FALLBACK_END;

  const startMinutes = Math.max(0, Math.floor(first / SLOT_MINUTES) * SLOT_MINUTES);
  const endMinutes = Math.min(24 * 60, Math.ceil(last / SLOT_MINUTES) * SLOT_MINUTES);
  const slotCount = Math.max(1, Math.ceil((endMinutes - startMinutes) / SLOT_MINUTES));

  return {
    startMinutes,
    slotMinutes: SLOT_MINUTES,
    slots: Array.from({ length: slotCount }, (_, index) => toTime(startMinutes + index * SLOT_MINUTES)),
  };
}

/** O que assignColumns precisa ler e escrever. */
export type Positionable = Span & {
  dayIndex: number;
  column: number;
  columnCount: number;
};

/**
 * Distribui atendimentos que se sobrepõem em colunas lado a lado, como num
 * calendário. Sem isso, dois profissionais atendendo no mesmo horário viravam
 * dois cards empilhados — o de cima escondendo o de baixo.
 *
 * Altera os itens no lugar: `column` (posição) e `columnCount` (em quantas
 * partes a largura do dia é dividida naquele trecho).
 */
export function assignColumns(items: Positionable[]): void {
  const byDay = new Map<number, Positionable[]>();
  for (const item of items) {
    const list = byDay.get(item.dayIndex) ?? [];
    list.push(item);
    byDay.set(item.dayIndex, list);
  }

  for (const dayItems of byDay.values()) {
    dayItems.sort((a, b) => a.startMinutes - b.startMinutes || a.durationMinutes - b.durationMinutes);

    // Um "grupo" é uma corrente de atendimentos que se tocam; todos dividem a
    // largura igualmente para que as colunas fiquem alinhadas.
    let group: Positionable[] = [];
    let columnEnds: number[] = [];

    const closeGroup = () => {
      for (const item of group) item.columnCount = columnEnds.length;
      group = [];
      columnEnds = [];
    };

    for (const item of dayItems) {
      const end = item.startMinutes + item.durationMinutes;
      if (group.length && item.startMinutes >= Math.max(...columnEnds)) closeGroup();

      const free = columnEnds.findIndex((columnEnd) => columnEnd <= item.startMinutes);
      if (free === -1) {
        item.column = columnEnds.length;
        columnEnds.push(end);
      } else {
        item.column = free;
        columnEnds[free] = end;
      }
      group.push(item);
    }
    closeGroup();
  }
}
