export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On leave",
  TERMINATED: "Terminated",
};

export function employmentStatusLabel(status: string) {
  return EMPLOYMENT_STATUS_LABELS[status] ?? status;
}

// The company's single business timezone — every displayed clock time uses
// this explicitly, rather than the implicit runtime timezone. Without it,
// the exact same Date renders differently depending on where the code
// happens to execute: correctly in a Client Component (the visitor's own
// browser), but as UTC in a Server Component (Vercel's runtime) — a real
// bug that showed up as two dashboard cards disagreeing by 5 hours (PKT's
// UTC offset) about the same check-in.
const DISPLAY_TIMEZONE = "Asia/Karachi";

export function formatTimeOfDay(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: DISPLAY_TIMEZONE,
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DISPLAY_TIMEZONE,
  }).format(date);
}

/** Minutes since local midnight, in the business timezone — for charts that position a time-of-day on an axis. */
export function minutesSinceMidnight(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
  }).format(amount);
}

/** Sum of break durations in minutes. An open break (no endedAt) counts up to now. */
export function totalBreakMinutes(
  breaks: { startedAt: Date; endedAt: Date | null }[],
) {
  const totalMs = breaks.reduce((sum, b) => {
    const end = b.endedAt ?? new Date();
    return sum + (end.getTime() - b.startedAt.getTime());
  }, 0);
  return Math.round(totalMs / 60000);
}

/**
 * Net worked milliseconds for one attendance record (breaks subtracted).
 * 0 for a record that isn't a completed shift (no checkIn/checkOut) — only
 * finished days count toward "hours worked" figures.
 */
export function workedMs(record: {
  checkIn: Date | null;
  checkOut: Date | null;
  breaks: { startedAt: Date; endedAt: Date | null }[];
}) {
  if (!record.checkIn || !record.checkOut) return 0;
  const grossMs = record.checkOut.getTime() - record.checkIn.getTime();
  const breakMs = record.breaks.reduce((sum, b) => {
    const end = b.endedAt ?? record.checkOut!;
    return sum + (end.getTime() - b.startedAt.getTime());
  }, 0);
  return Math.max(0, grossMs - breakMs);
}
