// ─── BigInt ↔ Date conversions ────────────────────────────────────

/** Convert JS Date/timestamp to bigint nanoseconds */
export function dateToNs(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

/** Convert bigint nanoseconds to JS Date */
export function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

/** Format a bigint ns timestamp as a readable date string */
export function formatDate(
  ns: bigint,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = nsToDate(ns);
  return date.toLocaleDateString(
    "en-US",
    opts ?? { year: "numeric", month: "short", day: "numeric" },
  );
}

/** Format a bigint ns timestamp as a readable time string */
export function formatTime(ns: bigint): string {
  const date = nsToDate(ns);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format both date and time */
export function formatDateTime(ns: bigint): string {
  const date = nsToDate(ns);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format offset minutes to human-readable reminder string */
export function formatReminderOffset(offsetMinutes: bigint): string {
  const mins = Number(offsetMinutes);
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} before`;
  if (mins < 1440) {
    const h = Math.floor(mins / 60);
    return `${h} hour${h !== 1 ? "s" : ""} before`;
  }
  if (mins < 10080) {
    const d = Math.floor(mins / 1440);
    return `${d} day${d !== 1 ? "s" : ""} before`;
  }
  const w = Math.floor(mins / 10080);
  return `${w} week${w !== 1 ? "s" : ""} before`;
}

/** Convert datetime-local input string to bigint ns */
export function localInputToNs(value: string): bigint {
  if (!value) return 0n;
  return dateToNs(new Date(value));
}

/** Convert bigint ns to datetime-local input string */
export function nsToLocalInput(ns: bigint): string {
  if (!ns) return "";
  const d = nsToDate(ns);
  // format: YYYY-MM-DDTHH:MM
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Today's start (midnight) as bigint ns */
export function todayStartNs(): bigint {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return dateToNs(d);
}

/** Today's end (23:59:59) as bigint ns */
export function todayEndNs(): bigint {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return dateToNs(d);
}

/** Get the first day of a month */
export function monthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/** Get the last day of a month */
export function monthEnd(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

/** Get all days in a calendar grid (42 cells = 6 weeks) */
export function getCalendarDays(year: number, month: number): Date[] {
  const first = monthStart(year, month);
  const startDay = first.getDay(); // 0=Sun
  const days: Date[] = [];
  // Fill preceding days from previous month
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push(d);
  }
  // Fill this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  // Fill remaining days to complete 42 cells
  while (days.length < 42) {
    const last = days[days.length - 1];
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    days.push(next);
  }
  return days;
}

/** Get days for a week view starting from a date */
export function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Check if two dates are the same calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Check if a bigint ns timestamp falls on a given date */
export function eventOnDate(ns: bigint, date: Date): boolean {
  return isSameDay(nsToDate(ns), date);
}
