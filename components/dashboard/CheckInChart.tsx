type DayPoint = { date: Date; checkInMinutes: number | null };

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function CheckInChart({ points }: { points: DayPoint[] }) {
  const present = points.filter((p) => p.checkInMinutes !== null);
  const values = present.map((p) => p.checkInMinutes!);
  const min = values.length ? Math.min(...values) - 30 : 480;
  const max = values.length ? Math.max(...values) + 30 : 600;
  const range = Math.max(max - min, 1);

  const barWidth = 16;
  const gap = 6;
  const chartHeight = 96;
  const width = points.length * (barWidth + gap);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">
        Check-in time — last {points.length} days
      </p>

      {values.length === 0 ? (
        <p className="text-sm text-foreground-muted">No check-ins yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            role="img"
            aria-label={`Check-in time for the last ${points.length} days`}
            width={width}
            height={chartHeight + 20}
            viewBox={`0 0 ${width} ${chartHeight + 20}`}
            className="overflow-visible"
          >
            {points.map((point, i) => {
              const x = i * (barWidth + gap);
              const dayLabel = new Intl.DateTimeFormat("en-US", {
                weekday: "narrow",
                timeZone: "UTC",
              }).format(point.date);

              if (point.checkInMinutes === null) {
                return (
                  <g key={point.date.toISOString()}>
                    <rect
                      x={x}
                      y={chartHeight - 4}
                      width={barWidth}
                      height={4}
                      rx={2}
                      className="fill-black/[.08] dark:fill-white/[.1]"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight + 14}
                      textAnchor="middle"
                      className="fill-foreground-muted text-[9px]"
                    >
                      {dayLabel}
                    </text>
                  </g>
                );
              }

              const ratio = (point.checkInMinutes - min) / range;
              const barHeight = Math.max(4, ratio * chartHeight);
              const y = chartHeight - barHeight;

              return (
                <g key={point.date.toISOString()}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    className="fill-accent"
                  >
                    <title>
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(point.date)}
                      : {formatMinutes(point.checkInMinutes)}
                    </title>
                  </rect>
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 14}
                    textAnchor="middle"
                    className="fill-foreground-muted text-[9px]"
                  >
                    {dayLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          <table className="sr-only">
            <caption>Check-in time per day</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Check-in time</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date.toISOString()}>
                  <td>
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    }).format(point.date)}
                  </td>
                  <td>
                    {point.checkInMinutes === null
                      ? "No check-in"
                      : formatMinutes(point.checkInMinutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
