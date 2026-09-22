import { StatusBadge } from "@/components/ui/StatusBadge";
import { StandupModalButton } from "@/components/dashboard/StandupModalButton";
import { totalBreakMinutes, formatTimeOfDay } from "@/lib/format";

const STATUS_TONE = {
  PRESENT: "success",
  ABSENT: "danger",
  HALF_DAY: "warning",
  ON_LEAVE: "warning",
  HOLIDAY: "neutral",
} as const;

const STATUS_LABEL = {
  PRESENT: "Present",
  ABSENT: "Absent",
  HALF_DAY: "Half day",
  ON_LEAVE: "On leave",
  HOLIDAY: "Holiday",
} as const;

export function AttendanceHistoryTable({
  records,
}: {
  records: {
    id: string;
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    status: keyof typeof STATUS_LABEL;
    standup: string | null;
    breaks: { startedAt: Date; endedAt: Date | null }[];
  }[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-foreground-muted">
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Check-in</th>
            <th className="px-4 py-2 font-medium">Check-out</th>
            <th className="px-4 py-2 font-medium">Breaks</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Standup</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-foreground-muted">
                No attendance records yet.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-foreground">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  }).format(record.date)}
                </td>
                <td className="px-4 py-2.5 text-foreground-muted">
                  {formatTimeOfDay(record.checkIn)}
                </td>
                <td className="px-4 py-2.5 text-foreground-muted">
                  {formatTimeOfDay(record.checkOut)}
                </td>
                <td className="px-4 py-2.5 text-foreground-muted">
                  {record.breaks.length === 0
                    ? "—"
                    : `${record.breaks.length} · ${totalBreakMinutes(record.breaks)} min`}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge
                    label={STATUS_LABEL[record.status]}
                    tone={STATUS_TONE[record.status]}
                  />
                </td>
                <td className="px-4 py-2.5">
                  {record.standup ? (
                    <StandupModalButton
                      standup={record.standup}
                      label={new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(record.date)}
                    />
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
