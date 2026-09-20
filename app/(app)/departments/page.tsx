import { PageHeader } from "@/components/layout/PageHeader";
import { CreateDepartmentForm } from "@/components/departments/CreateDepartmentForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DepartmentsPage() {
  await requireAdmin();

  // Deliberately not the cached read (lib/cache/departments.ts) — this is
  // the management page itself, so it should always show the true current
  // state, not a value that could be up to 5 minutes stale.
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { employees: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Departments"
        description={`${departments.length} ${departments.length === 1 ? "department" : "departments"}`}
      />
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <section className="max-w-md rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground-muted">
            Add department
          </h2>
          <CreateDepartmentForm />
        </section>

        {departments.length === 0 ? (
          <p className="text-sm text-foreground-muted">No departments yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-foreground-muted">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Employees</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr
                    key={department.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {department.name}
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {department._count.employees}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
