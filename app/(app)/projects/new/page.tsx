import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { requireEmployee, isAdmin, isProjectManager } from "@/lib/auth";

export default async function NewProjectPage() {
  const employee = await requireEmployee();
  if (!isAdmin(employee.role) && !isProjectManager(employee.role)) {
    redirect("/dashboard");
  }

  return (
    <>
      <PageHeader title="New project" />
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <CreateProjectForm />
        </div>
      </div>
    </>
  );
}
