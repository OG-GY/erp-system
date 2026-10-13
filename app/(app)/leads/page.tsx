import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { LeadBoard } from "@/components/leads/LeadBoard";
import { requireEmployee, isAdmin, isCallCaller } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const leadSelect = {
  id: true,
  businessName: true,
  city: true,
  contactName: true,
  status: true,
  priority: true,
  doNotCall: true,
  nextFollowUpDate: true,
  owner: { select: { id: true, fullName: true } },
  _count: { select: { calls: true } },
} as const;

export default async function LeadsPage() {
  const employee = await requireEmployee();
  if (!isAdmin(employee.role) && !isCallCaller(employee.role)) {
    redirect("/dashboard");
  }

  const leads = await prisma.lead.findMany({
    where: isAdmin(employee.role)
      ? undefined
      : { OR: [{ ownerId: employee.id }, { ownerId: null }] },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: leadSelect,
  });

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${leads.length} ${leads.length === 1 ? "lead" : "leads"}`}
        actions={
          <Link
            href="/leads/new"
            className="flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            New lead
          </Link>
        }
      />
      <div className="p-4 sm:p-6">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No leads yet</p>
            <Link
              href="/leads/new"
              className="mt-2 flex h-9 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              New lead
            </Link>
          </div>
        ) : (
          <LeadBoard leads={leads} showOwner={isAdmin(employee.role)} canDragAll />
        )}
      </div>
    </>
  );
}
