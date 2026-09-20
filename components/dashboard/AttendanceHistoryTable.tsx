import { StatusBadge } from "@/components/ui/StatusBadge";
import { totalBreakMinutes } from "@/lib/format";

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

function formatTime(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function AttendanceHistoryTable({
  records,
}: {
  records: {
    id: string;
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    status: keyof typeof STATUS_LABEL;
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
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-foreground-muted">
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
                  {formatTime(record.checkIn)}
                </td>
                <td className="px-4 py-2.5 text-foreground-muted">
                  {formatTime(record.checkOut)}
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
