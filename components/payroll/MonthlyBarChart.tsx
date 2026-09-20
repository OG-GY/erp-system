function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
}

export function MonthlyBarChart({
  title,
  months,
  formatValue,
  colorClassName = "fill-accent",
}: {
  title: string;
  months: { year: number; month: number; value: number }[];
  formatValue: (value: number) => string;
  colorClassName?: string;
}) {
  const max = Math.max(...months.map((m) => m.value), 1);
  const barWidth = 28;
  const gap = 12;
  const chartHeight = 120;
  const width = Math.max(months.length * (barWidth + gap), barWidth);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">{title}</p>

      {months.length === 0 ? (
        <p className="text-sm text-foreground-muted">No data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            role="img"
            aria-label={`${title} for the last ${months.length} months`}
            width={width}
            height={chartHeight + 34}
            viewBox={`0 0 ${width} ${chartHeight + 34}`}
            className="overflow-visible"
          >
            {months.map((m, i) => {
              const x = i * (barWidth + gap);
              const barHeight = Math.max(4, (m.value / max) * chartHeight);
              const y = chartHeight - barHeight;

              return (
                <g key={`${m.year}-${m.month}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    className={colorClassName}
                  >
                    <title>
                      {monthLabel(m.year, m.month)}: {formatValue(m.value)}
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
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={`${m.year}-${m.month}`}>
                  <td>{monthLabel(m.year, m.month)}</td>
                  <td>{formatValue(m.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
