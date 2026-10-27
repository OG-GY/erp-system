import { PageHeader } from "@/components/layout/PageHeader";
import { ColdLeadForm } from "@/components/cold-calling/ColdLeadForm";
import { requireEmployee } from "@/lib/auth";

export default async function NewColdLeadPage() {
  await requireEmployee();

  return (
    <>
      <PageHeader title="Add business" description="Someone you found and are about to call" />
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <ColdLeadForm />
        </div>
      </div>
    </>
  );
}
