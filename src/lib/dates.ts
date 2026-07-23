/**
 * Utilidades de data no fuso da clínica (padrão America/Sao_Paulo).
 *
 * O banco guarda tudo em timestamptz (UTC); a exibição e o cálculo de semanas
 * precisam acontecer no fuso da clínica para a grade da agenda bater com o que
 * a recepção enxerga.
 */

export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/** Diferença entre o horário local do fuso e o UTC, em milissegundos. */
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - instant.getTime();
}

/** Monta o instante correspondente a uma data/hora local do fuso informado. */
export function zonedDateTime(date: string, time: string, timeZone = DEFAULT_TIMEZONE): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  return new Date(guess - timeZoneOffsetMs(new Date(guess), timeZone));
}

/** "2026-07-23" para o instante, já no fuso da clínica. */
export function dateKey(instant: Date, timeZone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** "08:30" */
export function timeLabel(instant: Date | string, timeZone = DEFAULT_TIMEZONE): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return new Intl.DateTimeFormat("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

/** "23/07/2026" */
export function dateLabel(instant: Date | string | null, timeZone = DEFAULT_TIMEZONE): string {
  if (!instant) return "—";
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return new Intl.DateTimeFormat("pt-BR", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

/** "23/07, 08:30" — formato usado nas colunas de consulta. */
export function shortDateTimeLabel(instant: Date | string | null, timeZone = DEFAULT_TIMEZONE): string {
  if (!instant) return "—";
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return `${new Intl.DateTimeFormat("pt-BR", { timeZone, day: "2-digit", month: "2-digit" }).format(date)}, ${timeLabel(date, timeZone)}`;
}

/** "Quinta-feira, 23 de julho" */
export function longDateLabel(instant: Date, timeZone = DEFAULT_TIMEZONE): string {
  const text = new Intl.DateTimeFormat("pt-BR", { timeZone, weekday: "long", day: "numeric", month: "long" }).format(instant);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type Week = {
  /** Segunda-feira 00:00 no fuso da clínica. */
  start: Date;
  /** Sábado 00:00 — limite superior exclusivo da grade (seg–sex). */
  end: Date;
  /** As cinco datas úteis, em "2026-07-23". */
  days: string[];
  /** "20–24 de julho" */
  label: string;
};

/**
 * Semana útil (seg–sex) que contém `reference`, deslocada por `weekOffset`.
 */
export function workWeek(reference: Date, timeZone = DEFAULT_TIMEZONE, weekOffset = 0): Week {
  const key = dateKey(reference, timeZone);
  const [year, month, day] = key.split("-").map(Number);

  // getUTCDay em uma data "pura" devolve o dia da semana local do fuso.
  const local = new Date(Date.UTC(year, month - 1, day));
  const weekday = local.getUTCDay(); // 0 = domingo
  const daysSinceMonday = (weekday + 6) % 7;
  local.setUTCDate(local.getUTCDate() - daysSinceMonday + weekOffset * 7);

  const days = Array.from({ length: 5 }, (_, index) => {
    const item = new Date(local);
    item.setUTCDate(item.getUTCDate() + index);
    return item.toISOString().slice(0, 10);
  });

  const start = zonedDateTime(days[0], "00:00", timeZone);
  const end = zonedDateTime(days[4], "23:59", timeZone);

  const formatter = new Intl.DateTimeFormat("pt-BR", { timeZone, day: "numeric", month: "long" });
  const label = `${new Intl.DateTimeFormat("pt-BR", { timeZone, day: "numeric" }).format(start)}–${formatter.format(end)}`;

  return { start, end, days, label };
}

/** "Seg 20" — cabeçalho de coluna da agenda. */
export function weekdayColumnLabel(date: string, timeZone = DEFAULT_TIMEZONE): string {
  const instant = zonedDateTime(date, "12:00", timeZone);
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone, weekday: "short" }).format(instant).replace(".", "");
  const day = new Intl.DateTimeFormat("pt-BR", { timeZone, day: "2-digit" }).format(instant);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day}`;
}

/** Início e fim do mês corrente no fuso da clínica. */
export function currentMonthRange(reference: Date, timeZone = DEFAULT_TIMEZONE) {
  const [year, month] = dateKey(reference, timeZone).split("-").map(Number);
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start: zonedDateTime(firstDay, "00:00", timeZone), end: zonedDateTime(nextMonth, "00:00", timeZone) };
}
