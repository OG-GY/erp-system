import { PageHeader } from "@/components/layout/PageHeader";
import { CreatePayslipForm } from "@/components/payroll/CreatePayslipForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewPayslipPage() {
  await requireAdmin();

  const employees = await prisma.employee.findMany({
    where: { employmentStatus: "ACTIVE" },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
    take: 500,
  });

  return (
    <>
      <PageHeader title="Add payslip" />
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <CreatePayslipForm employees={employees} />
        </div>
      </div>
    </>
  );
}
