import Link from "next/link";
import { Wallet, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PayslipList } from "@/components/payroll/PayslipList";
import { MonthlyBarChart } from "@/components/payroll/MonthlyBarChart";
import { StatCard } from "@/components/ui/StatCard";
import { requireEmployee, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, workedMs } from "@/lib/format";

/** Buckets by UTC year/month (matches how @db.Date columns round-trip) and sums a value per bucket. */
function bucketByMonth<T>(
  items: T[],
  getDate: (item: T) => Date,
  getValue: (item: T) => number,
) {
  const byMonth = new Map<string, { year: number; month: number; value: number }>();
  for (const item of items) {
    const date = getDate(item);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const key = `${year}-${month}`;
    const existing = byMonth.get(key);
    if (existing) {
      existing.value += getValue(item);
    } else {
      byMonth.set(key, { year, month, value: getValue(item) });
    }
  }
  return Array.from(byMonth.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  );
}

export default async function PayrollPage() {
  const employee = await requireEmployee();

  if (isAdmin(employee.role)) {
    const payslips = await prisma.payslip.findMany({
      orderBy: { periodStart: "desc" },
      take: 200,
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        netSalary: true,
        status: true,
        employee: { select: { fullName: true } },
      },
    });

    return (
      <>
        <PageHeader
          title="Payroll"
          description="All employee payslips"
          actions={
            <Link
              href="/payroll/new"
              className="flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Add payslip
            </Link>
          }
        />
        <div className="p-4 sm:p-6">
          <PayslipList
            payslips={payslips.map((p) => ({
              ...p,
              netSalary: Number(p.netSalary),
            }))}
            editableStatus
          />
        </div>
      </>
    );
  }

  const [payslips, attendanceRecords] = await Promise.all([
    prisma.payslip.findMany({
      where: { employeeId: employee.id },
      orderBy: { periodStart: "desc" },
    }),
    // Only completed shifts count toward "hours worked". Take is a defensive
    // bound (this is a single employee's own history, not an unbounded read).
    prisma.attendanceRecord.findMany({
      where: { employeeId: employee.id, checkIn: { not: null }, checkOut: { not: null } },
      select: { date: true, checkIn: true, checkOut: true, breaks: { select: { startedAt: true, endedAt: true } } },
      take: 2000,
    }),
  ]);

  const hoursWorkedInRange = (start: Date, end: Date) =>
    attendanceRecords
      .filter((r) => r.date >= start && r.date <= end)
      .reduce((sum, r) => sum + workedMs(r), 0) / 3_600_000;

  const payslipsWithDetails = payslips.map((p) => ({
    id: p.id,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    netSalary: Number(p.netSalary),
    status: p.status,
    hoursWorked: hoursWorkedInRange(p.periodStart, p.periodEnd),
  }));

  const totalEarnings = payslipsWithDetails.reduce(
    (sum, p) => sum + p.netSalary,
    0,
  );
  const totalHoursWorked =
    attendanceRecords.reduce((sum, r) => sum + workedMs(r), 0) / 3_600_000;

  const earningsByMonth = bucketByMonth(
    payslips,
    (p) => p.periodStart,
    (p) => Number(p.netSalary),
  );
  const hoursByMonth = bucketByMonth(
    attendanceRecords,
    (r) => r.date,
    (r) => workedMs(r) / 3_600_000,
  );

  return (
    <>
      <PageHeader title="Payroll" description="Your payslips" />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Total earnings"
            value={formatCurrency(totalEarnings)}
            icon={Wallet}
            tone="amber"
          />
          <StatCard
            label="Total hours worked"
            value={`${totalHoursWorked.toFixed(1)}h`}
            icon={Clock}
            tone="info"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MonthlyBarChart
            title="Earnings per month"
            months={earningsByMonth}
            formatValue={formatCurrency}
          />
          <MonthlyBarChart
            title="Hours worked per month"
            months={hoursByMonth}
            formatValue={(v) => `${v.toFixed(1)}h`}
            colorClassName="fill-info"
          />
        </div>
        <PayslipList payslips={payslipsWithDetails} />
      </div>
    </>
  );
}
