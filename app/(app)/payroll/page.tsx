import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PayslipList } from "@/components/payroll/PayslipList";
import { requireEmployee, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
          />
        </div>
      </>
    );
  }

  const payslips = await prisma.payslip.findMany({
    where: { employeeId: employee.id },
    orderBy: { periodStart: "desc" },
  });

  return (
    <>
      <PageHeader title="Payroll" description="Your payslips" />
      <div className="p-4 sm:p-6">
        <PayslipList
          payslips={payslips.map((p) => ({
            id: p.id,
            periodStart: p.periodStart,
            periodEnd: p.periodEnd,
            netSalary: Number(p.netSalary),
            status: p.status,
          }))}
        />
      </div>
    </>
  );
}
