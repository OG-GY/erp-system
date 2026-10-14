import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImportLeadsWizard } from "@/components/leads/import/ImportLeadsWizard";
import { requireEmployee, isAdmin, isCallCaller } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ImportLeadsPage() {
  const employee = await requireEmployee();
  if (!isAdmin(employee.role) && !isCallCaller(employee.role)) {
    redirect("/dashboard");
  }

  const callers = isAdmin(employee.role)
    ? await prisma.employee.findMany({
        where: { role: "CALL_CALLER", employmentStatus: "ACTIVE" },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true },
      })
    : [];

  return (
    <>
      <PageHeader title="Import leads" description="From a CSV file" />
      <div className="p-4 sm:p-6">
        <ImportLeadsWizard callers={callers} viewerIsAdmin={isAdmin(employee.role)} />
      </div>
    </>
  );
}
