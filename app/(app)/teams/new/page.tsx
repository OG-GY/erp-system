import { PageHeader } from "@/components/layout/PageHeader";
import { CreateTeamForm } from "@/components/teams/CreateTeamForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewTeamPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="New team" />
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <CreateTeamForm />
        </div>
      </div>
    </>
  );
}
