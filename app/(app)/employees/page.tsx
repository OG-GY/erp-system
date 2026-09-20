import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { initials, employmentStatusLabel } from "@/lib/format";

const STATUS_TONE = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  INACTIVE: "neutral",
  TERMINATED: "danger",
} as const;

// Bounded read: internal roster, not an unbounded public dataset.
const MAX_EMPLOYEES = 500;

export default async function EmployeesPage() {
  await requireAdmin();

  const employees = await prisma.employee.findMany({
    take: MAX_EMPLOYEES,
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      employeeNumber: true,
      designation: true,
      employmentStatus: true,
      department: { select: { name: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Employees"
        description={`${employees.length} ${employees.length === 1 ? "employee" : "employees"}`}
        actions={
          <Link
            href="/employees/new"
            className="flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Add employee
          </Link>
        }
      />

      {employees.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            No employees yet
          </p>
          <p className="text-sm text-foreground-muted">
            Add your first employee to get started.
          </p>
          <Link
            href="/employees/new"
            className="mt-2 flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Add employee
          </Link>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-foreground-muted">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Employee #</th>
                  <th className="px-4 py-2 font-medium">Department</th>
                  <th className="px-4 py-2 font-medium">Designation</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/employees/${employee.id}`}
                        className="flex items-center gap-2.5 font-medium text-foreground hover:text-accent"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-[10px] font-semibold text-accent">
                          {initials(employee.fullName)}
                        </span>
                        {employee.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {employee.employeeNumber}
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {employee.department?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {employee.designation ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        label={employmentStatusLabel(employee.employmentStatus)}
                        tone={STATUS_TONE[employee.employmentStatus]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
