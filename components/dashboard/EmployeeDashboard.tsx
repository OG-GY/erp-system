import { PageHeader } from "@/components/layout/PageHeader";
import { CheckInCard } from "@/components/dashboard/CheckInCard";
import { CheckInChart } from "@/components/dashboard/CheckInChart";
import { AttendanceHistoryTable } from "@/components/dashboard/AttendanceHistoryTable";
import { AssignedProjectsCard } from "@/components/dashboard/AssignedProjectsCard";
import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";

const HISTORY_DAYS = 14;

export async function EmployeeDashboard({
  employeeId,
  firstName,
}: {
  employeeId: string;
  firstName: string;
}) {
  const today = todayDateOnly();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const rangeStart = new Date(today.getTime() - (HISTORY_DAYS - 1) * DAY_MS);

  const [records, projectMembers] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { employeeId, date: { gte: rangeStart, lte: today } },
      orderBy: { date: "desc" },
      include: { breaks: { where: { endedAt: null }, take: 1 } },
    }),
    prisma.projectMember.findMany({
      where: { employeeId },
      select: { project: { select: { id: true, name: true, status: true } } },
      take: 20,
    }),
  ]);

  const todayRecord = records.find((r) => r.date.getTime() === today.getTime());

  const recordsByDate = new Map(
    records.map((r) => [r.date.toISOString().slice(0, 10), r]),
  );
  const chartPoints = Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const date = new Date(rangeStart.getTime() + i * DAY_MS);
    const record = recordsByDate.get(date.toISOString().slice(0, 10));
    const checkInMinutes = record?.checkIn
      ? record.checkIn.getHours() * 60 + record.checkIn.getMinutes()
      : null;
    return { date, checkInMinutes };
  });

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${firstName}`} />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CheckInCard
            checkInTime={todayRecord?.checkIn ?? null}
            checkOutTime={todayRecord?.checkOut ?? null}
            openBreakStartedAt={todayRecord?.breaks[0]?.startedAt ?? null}
          />
          <CheckInChart points={chartPoints} />
          <AssignedProjectsCard
            projects={projectMembers.map((m) => m.project)}
          />
        </div>

        <div>
          <p className="mb-2 text-xs text-foreground-muted">
            Attendance history
          </p>
          <AttendanceHistoryTable records={records} />
        </div>
      </div>
    </>
  );
}
