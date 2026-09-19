import { PageHeader } from "@/components/layout/PageHeader";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewProjectPage() {
  await requireAdmin();

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
