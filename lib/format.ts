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
