import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";

const LEAVE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const PROJECT_STATUS_LABEL: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

function BreakdownList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-foreground-muted">No data yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-foreground-muted">{row.label}</span>
              <span className="font-medium text-foreground">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function ReportsPage() {
  await requireAdmin();

  const DAY_MS = 24 * 60 * 60 * 1000;
  const today = todayDateOnly();
  const thirtyDaysAgo = new Date(today.getTime() - 29 * DAY_MS);

  const [
    activeEmployees,
    presentLast30,
    activeProjects,
    departmentCounts,
    departments,
    leaveCounts,
    projectCounts,
    paidTotal,
  ] = await Promise.all([
    prisma.employee.count({ where: { employmentStatus: "ACTIVE" } }),
    prisma.attendanceRecord.count({
      where: { status: "PRESENT", date: { gte: thirtyDaysAgo, lte: today } },
    }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.employee.groupBy({
      by: ["departmentId"],
      where: { employmentStatus: "ACTIVE" },
      _count: { _all: true },
    }),
    prisma.department.findMany({ select: { id: true, name: true } }),
    prisma.leaveRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payslip.aggregate({
      where: { status: "PAID" },
      _sum: { netSalary: true },
    }),
  ]);

  const attendanceRate =
    activeEmployees > 0
      ? Math.round((presentLast30 / (activeEmployees * 30)) * 100)
      : 0;

  const departmentNameById = new Map(departments.map((d) => [d.id, d.name]));
  const headcountRows = departmentCounts
    .map((row) => ({
      label: row.departmentId
        ? (departmentNameById.get(row.departmentId) ?? "Unknown")
        : "No department",
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const leaveRows = leaveCounts.map((row) => ({
    label: LEAVE_STATUS_LABEL[row.status] ?? row.status,
    count: row._count._all,
  }));

  const projectRows = projectCounts.map((row) => ({
    label: PROJECT_STATUS_LABEL[row.status] ?? row.status,
    count: row._count._all,
  }));

  return (
    <>
      <PageHeader title="Reports" description="Organization overview" />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Active employees" value={activeEmployees} />
          <StatCard label="Attendance rate (30d)" value={`${attendanceRate}%`} />
          <StatCard label="Active projects" value={activeProjects} />
          <StatCard
            label="Total paid"
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(Number(paidTotal._sum.netSalary ?? 0))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BreakdownList title="Headcount by department" rows={headcountRows} />
          <BreakdownList title="Leave requests by status" rows={leaveRows} />
          <BreakdownList title="Projects by status" rows={projectRows} />
        </div>
      </div>
    </>
  );
}
