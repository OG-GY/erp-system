import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/auth";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const employee = await requireEmployee();

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
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${employee.fullName.split(" ")[0]}`}
      />
      <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
        <StatCard label="Active employees" value={totalEmployees} />
        <StatCard label="Present today" value={presentToday} />
        <StatCard label="Pending leave requests" value={pendingLeave} />
        <StatCard label="Open tasks" value={openTasks} />
      </div>
    </>
  );
}
