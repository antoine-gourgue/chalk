/**
 * Les dates de séance sont des jours calendaires, pas des instants : elles sont
 * toujours manipulées à minuit UTC pour qu'un fuseau ne décale jamais une séance
 * d'un jour.
 */

export function toDayDate(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00.000Z`) : value;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

export function toDayKey(date: Date): string {
  return toDayDate(date).toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(toDayDate(date).getTime() + days * 86_400_000);
}

/** Lundi de la semaine contenant `date` (semaine ISO, lundi → dimanche). */
export function mondayOf(date: Date): Date {
  const day = toDayDate(date);
  const weekday = day.getUTCDay() === 0 ? 7 : day.getUTCDay();
  return addDays(day, 1 - weekday);
}

export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

const DAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function dayName(date: Date): string {
  const weekday = toDayDate(date).getUTCDay();
  return DAY_NAMES[weekday === 0 ? 6 : weekday - 1];
}

export function formatDayLong(date: Date): string {
  const day = toDayDate(date);
  return `${dayName(day)} ${day.getUTCDate()} ${MONTH_NAMES[day.getUTCMonth()]}`;
}

export function formatDayShort(date: Date): string {
  const day = toDayDate(date);
  return `${String(day.getUTCDate()).padStart(2, "0")}.${String(day.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getUTCMonth() === sunday.getUTCMonth();
  const start = sameMonth
    ? String(monday.getUTCDate())
    : `${monday.getUTCDate()} ${MONTH_NAMES[monday.getUTCMonth()]}`;
  return `${start} — ${sunday.getUTCDate()} ${MONTH_NAMES[sunday.getUTCMonth()]}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDayKey(a) === toDayKey(b);
}
