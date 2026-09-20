import { PageHeader } from "@/components/layout/PageHeader";
import { CreateEmployeeForm } from "@/components/employees/CreateEmployeeForm";
import { requireAdmin } from "@/lib/auth";
import { getCachedDepartments } from "@/lib/cache/departments";

export default async function NewEmployeePage() {
  await requireAdmin();

  const departments = await getCachedDepartments();

  return (
    <>
      <PageHeader title="Add employee" description="Create a login and profile" />
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <CreateEmployeeForm departments={departments} />
        </div>
      </div>
    </>
  );
}
