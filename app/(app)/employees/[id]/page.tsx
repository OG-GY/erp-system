import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SalaryForm } from "@/components/employees/SalaryForm";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { initials, employmentStatusLabel } from "@/lib/format";

const STATUS_TONE = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  INACTIVE: "neutral",
  TERMINATED: "danger",
} as const;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export default async function EmployeeDetailPage({
  params,
}: PageProps<"/employees/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      employeeNumber: true,
      officialEmail: true,
      phone: true,
      designation: true,
      employmentStatus: true,
      employmentType: true,
      joiningDate: true,
      department: { select: { name: true } },
      team: { select: { name: true } },
      manager: { select: { fullName: true } },
      salaryType: true,
      baseSalary: true,
      commissionPerProject: true,
    },
  });

  if (!employee) {
    notFound();
  }

  return (
    <>
      <PageHeader title={employee.fullName} description={employee.employeeNumber} />
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-sm font-semibold text-accent">
              {initials(employee.fullName)}
            </span>
            <div>
              <p className="font-medium text-foreground">{employee.fullName}</p>
              <p className="text-sm text-foreground-muted">
                {employee.designation ?? "No designation set"}
              </p>
            </div>
            <StatusBadge
              label={employmentStatusLabel(employee.employmentStatus)}
              tone={STATUS_TONE[employee.employmentStatus]}
              className="ml-auto"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Official email" value={employee.officialEmail} />
            <Field label="Phone" value={employee.phone ?? "—"} />
            <Field label="Department" value={employee.department?.name ?? "—"} />
            <Field label="Team" value={employee.team?.name ?? "—"} />
            <Field label="Manager" value={employee.manager?.fullName ?? "—"} />
            <Field
              label="Joining date"
              value={new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
              }).format(employee.joiningDate)}
            />
          </div>
        </div>

        <div className="mt-6 max-w-2xl rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground-muted">
            Salary
          </h2>
          <SalaryForm
            employeeId={employee.id}
            currentSalaryType={employee.salaryType}
            currentBaseSalary={
              employee.baseSalary ? Number(employee.baseSalary) : null
            }
            currentCommissionPerProject={
              employee.commissionPerProject
                ? Number(employee.commissionPerProject)
                : null
            }
          />
        </div>
      </div>
    </>
  );
}
