import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";

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

export default async function AttendancePage() {
  await requireAdmin();

  const today = todayDateOnly();

  const records = await prisma.attendanceRecord.findMany({
    where: { date: today },
    orderBy: { employee: { fullName: "asc" } },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      status: true,
      employee: { select: { id: true, fullName: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`Today · ${records.length} ${records.length === 1 ? "record" : "records"}`}
      />
      <div className="p-4 sm:p-6">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              No attendance recorded yet today
            </p>
            <p className="text-sm text-foreground-muted">
              Records show up here as employees check in.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-foreground-muted">
                  <th className="px-4 py-2 font-medium">Employee</th>
                  <th className="px-4 py-2 font-medium">Check-in</th>
                  <th className="px-4 py-2 font-medium">Check-out</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {record.employee.fullName}
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {formatTime(record.checkIn)}
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {formatTime(record.checkOut)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        label={STATUS_LABEL[record.status]}
                        tone={STATUS_TONE[record.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
