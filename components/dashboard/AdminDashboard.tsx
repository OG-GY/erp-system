import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { prisma } from "@/lib/prisma";

export async function AdminDashboard({ firstName }: { firstName: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalEmployees, presentToday, pendingLeave, openTasks] =
    await Promise.all([
      prisma.employee.count({ where: { employmentStatus: "ACTIVE" } }),
      prisma.attendanceRecord.count({
        where: { date: today, status: "PRESENT" },
      }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.task.count({
        where: { status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] } },
      }),
    ]);

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${firstName}`} />
      <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
        <StatCard label="Active employees" value={totalEmployees} />
        <StatCard label="Present today" value={presentToday} />
        <StatCard label="Pending leave requests" value={pendingLeave} />
        <StatCard label="Open tasks" value={openTasks} />
      </div>
    </>
  );
}
