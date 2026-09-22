"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatTimeOfDay, minutesSinceMidnight } from "@/lib/format";

type Member = { id: string; fullName: string };
type Point = { date: Date; byEmployee: Record<string, Date | null> };

// Cycles if a team has more than 6 members — an acceptable limit for now,
// all drawn from the app's existing theme-aware tokens.
const COLORS = [
  { stroke: "stroke-accent", fill: "fill-accent", text: "text-accent" },
  { stroke: "stroke-success", fill: "fill-success", text: "text-success" },
  {
    stroke: "stroke-accent-secondary",
    fill: "fill-accent-secondary",
    text: "text-accent-secondary",
  },
  { stroke: "stroke-danger", fill: "fill-danger", text: "text-danger" },
  { stroke: "stroke-info", fill: "fill-info", text: "text-info" },
  { stroke: "stroke-warning", fill: "fill-warning", text: "text-warning" },
];

function formatAxisTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = ((minutes % 60) + 60) % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function shortDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function fullDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function TeamCheckInTimesChart({
  members,
  points,
}: {
  members: Member[];
  points: Point[];
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-foreground-muted">
          No members on this team yet.
        </p>
      </div>
    );
  }

  const allMinutes: number[] = [];
  for (const point of points) {
    for (const member of members) {
      const checkIn = point.byEmployee[member.id];
      if (checkIn) allMinutes.push(minutesSinceMidnight(checkIn));
    }
  }

  if (allMinutes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-foreground-muted">
          No check-ins in this date range yet.
        </p>
      </div>
    );
  }

  // Snap the axis range to 2-hour boundaries for clean tick labels.
  const yMin = Math.floor((Math.min(...allMinutes) - 60) / 120) * 120;
  const yMax = Math.ceil((Math.max(...allMinutes) + 60) / 120) * 120;
  const yRange = Math.max(yMax - yMin, 120);

  const ticks: number[] = [];
  for (let t = yMin; t <= yMax; t += 120) ticks.push(t);

  const daySpacing = 56;
  const chartHeight = 220;
  const leftAxisWidth = 56;
  const chartWidth = points.length * daySpacing;
  const totalWidth = chartWidth + leftAxisWidth;
  const totalHeight = chartHeight + 40;

  function yFor(minutes: number) {
    return chartHeight - ((minutes - yMin) / yRange) * chartHeight;
  }
  function xFor(index: number) {
    return leftAxisWidth + index * daySpacing + daySpacing / 2;
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-1 text-sm font-medium text-foreground">
        Check-in times
      </p>
      <p className="mb-3 text-xs text-foreground-muted">
        Tap a day to see everyone&apos;s check-in time.
      </p>

      <div className="overflow-x-auto">
        <div className="relative" style={{ width: totalWidth }}>
          <svg
            role="img"
            aria-label="Check-in time per day for each team member"
            width={totalWidth}
            height={totalHeight}
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={leftAxisWidth}
                  x2={totalWidth}
                  y1={yFor(t)}
                  y2={yFor(t)}
                  className="stroke-border"
                  strokeDasharray="3 3"
                />
                <text
                  x={leftAxisWidth - 8}
                  y={yFor(t) + 3}
                  textAnchor="end"
                  className="fill-foreground-muted text-[9px]"
                >
                  {formatAxisTime(t)}
                </text>
              </g>
            ))}

            {members.map((member, mi) => {
              const color = COLORS[mi % COLORS.length];
              const segments: { x: number; y: number }[][] = [];
              let current: { x: number; y: number }[] = [];
              points.forEach((point, i) => {
                const checkIn = point.byEmployee[member.id];
                if (checkIn) {
                  current.push({
                    x: xFor(i),
                    y: yFor(minutesSinceMidnight(checkIn)),
                  });
                } else if (current.length) {
                  segments.push(current);
                  current = [];
                }
              });
              if (current.length) segments.push(current);

              return (
                <g key={member.id}>
                  {segments.map((segment, si) => (
                    <polyline
                      key={si}
                      points={segment.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      className={color.stroke}
                      strokeWidth={2}
                    />
                  ))}
                  {points.map((point, i) => {
                    const checkIn = point.byEmployee[member.id];
                    if (!checkIn) return null;
                    return (
                      <circle
                        key={i}
                        cx={xFor(i)}
                        cy={yFor(minutesSinceMidnight(checkIn))}
                        r={selectedIndex === i ? 4.5 : 3}
                        className={color.fill}
                      />
                    );
                  })}
                </g>
              );
            })}

            {selectedIndex !== null ? (
              <line
                x1={xFor(selectedIndex)}
                x2={xFor(selectedIndex)}
                y1={0}
                y2={chartHeight}
                className="stroke-foreground-muted"
                strokeWidth={1}
              />
            ) : null}

            {points.map((point, i) => (
              <text
                key={i}
                x={xFor(i)}
                y={chartHeight + 16}
                textAnchor="middle"
                className="fill-foreground-muted text-[9px]"
              >
                {shortDateLabel(point.date)}
              </text>
            ))}
          </svg>

          <div
            className="absolute inset-0 flex"
            style={{ paddingLeft: leftAxisWidth, height: chartHeight }}
          >
            {points.map((point, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
                aria-label={`Show check-in times for ${fullDateLabel(point.date)}`}
                style={{ width: daySpacing }}
                className="h-full outline-none focus-visible:bg-overlay-hover"
              />
            ))}
          </div>
        </div>
      </div>

      {selectedIndex !== null ? (
        <div className="mt-3 max-w-xs rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              {fullDateLabel(points[selectedIndex].date)}
            </p>
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              aria-label="Close"
              className="rounded-sm p-0.5 text-foreground-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {members.map((member, mi) => {
              const color = COLORS[mi % COLORS.length];
              const checkIn = points[selectedIndex].byEmployee[member.id];
              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className={`flex items-center gap-1.5 ${color.text}`}>
                    <span className={`h-2 w-2 rounded-full ${color.fill}`} />
                    {member.fullName}
                  </span>
                  <span className="text-foreground-muted">
                    {checkIn ? formatTimeOfDay(checkIn) : "Not checked in"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {members.map((member, mi) => {
          const color = COLORS[mi % COLORS.length];
          return (
            <span
              key={member.id}
              className={`flex items-center gap-1.5 text-xs ${color.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${color.fill}`} />
              {member.fullName}
            </span>
          );
        })}
      </div>
    </div>
  );
}
