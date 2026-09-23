import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { StandupModalButton } from "@/components/dashboard/StandupModalButton";
import { AttendanceRowActions } from "@/components/attendance/AttendanceRowActions";
import { AddAttendanceRecordButton } from "@/components/attendance/AddAttendanceRecordButton";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";
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

function parseDateParam(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default async function AttendancePage({
  searchParams,
}: PageProps<"/attendance">) {
  await requireAdmin();

  const today = todayDateOnly();
  const params = await searchParams;
  const dateParam = Array.isArray(params?.date) ? params.date[0] : params?.date;
  const selectedDate = parseDateParam(dateParam) ?? today;
  const isToday = selectedDate.getTime() === today.getTime();

  const [records, employees] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { date: selectedDate },
      orderBy: { employee: { fullName: "asc" } },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
        standup: true,
        employee: { select: { id: true, fullName: true } },
        breaks: { select: { startedAt: true, endedAt: true } },
      },
    }),
    prisma.employee.findMany({
      where: { employmentStatus: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
      take: 500,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`${isToday ? "Today" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(selectedDate)} · ${records.length} ${records.length === 1 ? "record" : "records"}`}
        actions={
          <AddAttendanceRecordButton
            employees={employees}
            todayValue={today.toISOString().slice(0, 10)}
          />
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <form method="get" className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-xs font-medium text-foreground-muted">
              Date
            </label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={selectedDate.toISOString().slice(0, 10)}
              max={today.toISOString().slice(0, 10)}
              className="w-44"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
          >
            View
          </button>
        </form>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              No attendance recorded {isToday ? "yet today" : "for this day"}
            </p>
            {isToday ? (
              <p className="text-sm text-foreground-muted">
                Records show up here as employees check in.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-foreground-muted">
                  <th className="px-4 py-2 font-medium">Employee</th>
                  <th className="px-4 py-2 font-medium">Check-in</th>
                  <th className="px-4 py-2 font-medium">Check-out</th>
                  <th className="px-4 py-2 font-medium">Breaks</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Standup</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {record.employee.fullName}
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
                          label={record.employee.fullName}
                        />
                      ) : (
                        <span className="text-foreground-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <AttendanceRowActions
                        recordId={record.id}
                        employeeName={record.employee.fullName}
                        checkIn={record.checkIn}
                        checkOut={record.checkOut}
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
