import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SimCallBoard } from "@/components/leads/SimCallBoard";
import { requireEmployee, isAdmin, isCallCaller } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const leadSelect = {
  id: true,
  businessName: true,
  city: true,
  contactName: true,
  simCallStatus: true,
  priority: true,
  doNotCall: true,
  nextFollowUpDate: true,
  owner: { select: { id: true, fullName: true } },
  _count: { select: { calls: true } },
} as const;

export default async function SimCallsPage() {
  const employee = await requireEmployee();
  if (!isAdmin(employee.role) && !isCallCaller(employee.role)) {
    redirect("/dashboard");
  }

  const leads = await prisma.lead.findMany({
    where: {
      simCallStatus: { not: null },
      ...(isAdmin(employee.role) ? {} : { OR: [{ ownerId: employee.id }, { ownerId: null }] }),
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
    select: leadSelect,
  });

  return (
    <>
      <PageHeader
        title="SIM / local calls needed"
        description={`${leads.length} ${leads.length === 1 ? "lead" : "leads"} unreachable on WhatsApp`}
        actions={
          <Link
            href="/leads"
            className="flex h-8 items-center rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
          >
            Back to Leads
          </Link>
        }
      />
      <div className="p-4 sm:p-6">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">Nothing here</p>
            <p className="text-sm text-foreground-muted">
              Flag a lead as needing a SIM/local call from its detail page when WhatsApp can&apos;t
              reach them — it&apos;ll show up on this board.
            </p>
          </div>
        ) : (
          <SimCallBoard leads={leads} showOwner={isAdmin(employee.role)} canDragAll />
        )}
      </div>
    </>
  );
}
