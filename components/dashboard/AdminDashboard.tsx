import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PresentTodayCard } from "@/components/dashboard/PresentTodayCard";
import { ActiveCheckInsList } from "@/components/dashboard/ActiveCheckInsList";
import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";

export async function AdminDashboard({ firstName }: { firstName: string }) {
  const today = todayDateOnly();

  const [totalEmployees, todayRecords, pendingLeave, openTasks] =
    await Promise.all([
      prisma.employee.count({ where: { employmentStatus: "ACTIVE" } }),
      prisma.attendanceRecord.findMany({
        where: { date: today, status: "PRESENT" },
        select: {
          checkIn: true,
          checkOut: true,
          employee: {
            select: { id: true, fullName: true, designation: true },
          },
        },
      }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.task.count({
        where: { status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] } },
      }),
    ]);

  const activeCheckIns = todayRecords
    .filter((r) => r.checkIn && !r.checkOut)
    .map((r) => ({
      id: r.employee.id,
      fullName: r.employee.fullName,
      designation: r.employee.designation,
      checkIn: r.checkIn!,
    }))
    .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${firstName}`} />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Active employees" value={totalEmployees} />
          <PresentTodayCard count={todayRecords.length} activeNow={activeCheckIns} />
          <StatCard label="Pending leave requests" value={pendingLeave} />
          <StatCard label="Open tasks" value={openTasks} />
        </div>

        <ActiveCheckInsList employees={activeCheckIns} />
      </div>
    </>
  );
}
