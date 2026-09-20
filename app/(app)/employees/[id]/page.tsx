import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SalaryForm } from "@/components/employees/SalaryForm";
import { EditEmployeeForm } from "@/components/employees/EditEmployeeForm";
import { SuspendButton } from "@/components/employees/SuspendButton";
import { DeleteEmployeeButton } from "@/components/employees/DeleteEmployeeButton";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCachedDepartments } from "@/lib/cache/departments";
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
  const admin = await requireAdmin();
  const { id } = await params;

  const [employee, departments] = await Promise.all([
    prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        employeeNumber: true,
        officialEmail: true,
        phone: true,
        designation: true,
        role: true,
        employmentStatus: true,
        employmentType: true,
        joiningDate: true,
        departmentId: true,
        department: { select: { name: true } },
        team: { select: { name: true } },
        manager: { select: { fullName: true } },
        salaryType: true,
        baseSalary: true,
        commissionPerProject: true,
      },
    }),
    getCachedDepartments(),
  ]);

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
            Edit details
          </h2>
          <EditEmployeeForm
            employeeId={employee.id}
            departments={departments}
            defaultFullName={employee.fullName}
            defaultDesignation={employee.designation ?? ""}
            defaultRole={employee.role}
            defaultEmploymentType={employee.employmentType}
            defaultEmploymentStatus={employee.employmentStatus}
            defaultJoiningDate={employee.joiningDate.toISOString().slice(0, 10)}
            defaultDepartmentId={employee.departmentId ?? ""}
          />
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

        {employee.id !== admin.id ? (
          <div className="mt-6 max-w-2xl rounded-lg border border-danger/30 bg-surface p-6">
            <h2 className="mb-1 text-sm font-medium text-foreground-muted">
              Danger zone
            </h2>
            <p className="mb-4 text-sm text-foreground-muted">
              Suspend to temporarily block access, or delete if this
              employee has no attendance, task, or payroll history.
            </p>
            <div className="flex flex-wrap gap-2">
              {employee.employmentStatus === "ACTIVE" ||
              employee.employmentStatus === "INACTIVE" ? (
                <SuspendButton
                  employeeId={employee.id}
                  isActive={employee.employmentStatus === "ACTIVE"}
                />
              ) : null}
              <DeleteEmployeeButton
                employeeId={employee.id}
                employeeName={employee.fullName}
              />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
