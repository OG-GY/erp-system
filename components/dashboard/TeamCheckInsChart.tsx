import { initials } from "@/lib/format";

type Teammate = {
  id: string;
  fullName: string;
  checkIn: Date | null;
  checkOut: Date | null;
};

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function TeamCheckInsChart({ teammates }: { teammates: Teammate[] }) {
  const present = teammates.filter((t) => t.checkIn);
  const values = present.map(
    (t) => t.checkIn!.getHours() * 60 + t.checkIn!.getMinutes(),
  );
  const min = values.length ? Math.min(...values) - 30 : 480;
  const max = values.length ? Math.max(...values) + 30 : 600;
  const range = Math.max(max - min, 1);

  const barWidth = 28;
  const gap = 16;
  const chartHeight = 110;
  const width = Math.max(teammates.length * (barWidth + gap), barWidth);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-foreground-muted">Team check-ins — today</p>
        {teammates.length > 0 ? (
          <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success" /> Active now
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-accent" /> Checked out
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-overlay-neutral" /> Not
              in yet
            </span>
          </div>
        ) : null}
      </div>

      {teammates.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          You&apos;re not part of a team yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            role="img"
            aria-label="Today's check-in time for each teammate"
            width={width}
            height={chartHeight + 34}
            viewBox={`0 0 ${width} ${chartHeight + 34}`}
            className="overflow-visible"
          >
            {teammates.map((teammate, i) => {
              const x = i * (barWidth + gap);
              const label = initials(teammate.fullName);

              if (!teammate.checkIn) {
                return (
                  <g key={teammate.id}>
                    <rect
                      x={x}
                      y={chartHeight - 4}
                      width={barWidth}
                      height={4}
                      rx={2}
                      className="fill-overlay-neutral"
                    >
                      <title>{teammate.fullName}: not checked in yet</title>
                    </rect>
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight + 16}
                      textAnchor="middle"
                      className="fill-foreground-muted text-[9px]"
                    >
                      {label}
                    </text>
                  </g>
                );
              }

              const minutes =
                teammate.checkIn.getHours() * 60 + teammate.checkIn.getMinutes();
              const ratio = (minutes - min) / range;
              const barHeight = Math.max(4, ratio * chartHeight);
              const y = chartHeight - barHeight;
              const isActive = !teammate.checkOut;

              return (
                <g key={teammate.id}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    className={isActive ? "fill-success" : "fill-accent"}
                  >
                    <title>
                      {teammate.fullName}: {formatMinutes(minutes)}
                      {isActive ? " · active now" : " · checked out"}
                    </title>
                  </rect>
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 16}
                    textAnchor="middle"
                    className="fill-foreground-muted text-[9px]"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>

          <table className="sr-only">
            <caption>Today&apos;s check-in time per teammate</caption>
            <thead>
              <tr>
                <th scope="col">Teammate</th>
                <th scope="col">Check-in time</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {teammates.map((teammate) => (
                <tr key={teammate.id}>
                  <td>{teammate.fullName}</td>
                  <td>
                    {teammate.checkIn
                      ? formatMinutes(
                          teammate.checkIn.getHours() * 60 +
                            teammate.checkIn.getMinutes(),
                        )
                      : "Not checked in"}
                  </td>
                  <td>
                    {!teammate.checkIn
                      ? "—"
                      : teammate.checkOut
                        ? "Checked out"
                        : "Active now"}
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
