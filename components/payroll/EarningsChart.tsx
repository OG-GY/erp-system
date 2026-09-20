import { formatCurrency } from "@/lib/format";

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
}

export function EarningsChart({
  payslips,
}: {
  payslips: { periodStart: Date; netSalary: number }[];
}) {
  // Payslip periods are @db.Date (timezone-agnostic) columns, so bucket by
  // UTC year/month to match how they're stored — same convention used
  // elsewhere for date-only fields (see lib/date.ts).
  const byMonth = new Map<string, { year: number; month: number; total: number }>();
  for (const p of payslips) {
    const year = p.periodStart.getUTCFullYear();
    const month = p.periodStart.getUTCMonth();
    const key = `${year}-${month}`;
    const existing = byMonth.get(key);
    if (existing) {
      existing.total += p.netSalary;
    } else {
      byMonth.set(key, { year, month, total: p.netSalary });
    }
  }

  const months = Array.from(byMonth.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  );

  const max = Math.max(...months.map((m) => m.total), 1);
  const barWidth = 28;
  const gap = 12;
  const chartHeight = 120;
  const width = Math.max(months.length * (barWidth + gap), barWidth);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">Earnings per month</p>

      {months.length === 0 ? (
        <p className="text-sm text-foreground-muted">No payslips yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            role="img"
            aria-label={`Earnings per month for the last ${months.length} months`}
            width={width}
            height={chartHeight + 34}
            viewBox={`0 0 ${width} ${chartHeight + 34}`}
            className="overflow-visible"
          >
            {months.map((m) => {
              const i = months.indexOf(m);
              const x = i * (barWidth + gap);
              const barHeight = Math.max(4, (m.total / max) * chartHeight);
              const y = chartHeight - barHeight;

              return (
                <g key={`${m.year}-${m.month}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    className="fill-accent"
                  >
                    <title>
                      {monthLabel(m.year, m.month)}: {formatCurrency(m.total)}
                    </title>
                  </rect>
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 16}
                    textAnchor="middle"
                    className="fill-foreground-muted text-[10px]"
                  >
                    {monthLabel(m.year, m.month)}
                  </text>
                </g>
              );
            })}
          </svg>

          <table className="sr-only">
            <caption>Earnings per month</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Net earnings</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={`${m.year}-${m.month}`}>
                  <td>{monthLabel(m.year, m.month)}</td>
                  <td>{formatCurrency(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
