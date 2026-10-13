import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateLeadForm } from "@/components/leads/CreateLeadForm";
import { requireEmployee, isAdmin, isCallCaller } from "@/lib/auth";

export default async function NewLeadPage() {
  const employee = await requireEmployee();
  if (!isAdmin(employee.role) && !isCallCaller(employee.role)) {
    redirect("/dashboard");
  }

  return (
    <>
      <PageHeader title="New lead" />
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <CreateLeadForm />
        </div>
      </div>
    </>
  );
}
