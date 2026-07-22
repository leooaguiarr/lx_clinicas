const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// Data de referência dos dados simulados (America/Sao_Paulo)
export const MOCK_TODAY = new Date(2026, 6, 21);

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const diff = (d.getDay() + 6) % 7; // segunda-feira como início
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b);
}

/** "Seg 20" */
export function weekdayLabel(date: Date): string {
  return `${WEEKDAY_SHORT[date.getDay()]} ${date.getDate()}`;
}

/** "20–24 julho" ou "29 junho – 3 julho" */
export function weekRangeShort(monday: Date): string {
  const friday = addDays(monday, 4);
  if (monday.getMonth() === friday.getMonth()) {
    return `${monday.getDate()}–${friday.getDate()} ${MONTHS[monday.getMonth()]}`;
  }
  return `${monday.getDate()} ${MONTHS[monday.getMonth()]} – ${friday.getDate()} ${MONTHS[friday.getMonth()]}`;
}

/** "Semana de 20 a 24 de julho de 2026" */
export function weekRangeLong(monday: Date): string {
  const friday = addDays(monday, 4);
  if (monday.getMonth() === friday.getMonth()) {
    return `Semana de ${monday.getDate()} a ${friday.getDate()} de ${MONTHS[monday.getMonth()]} de ${friday.getFullYear()}`;
  }
  return `Semana de ${monday.getDate()} de ${MONTHS[monday.getMonth()]} a ${friday.getDate()} de ${MONTHS[friday.getMonth()]} de ${friday.getFullYear()}`;
}

/** "09:45" a partir de "09:00" + minutos */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
