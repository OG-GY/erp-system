import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EditLeadForm } from "@/components/leads/EditLeadForm";
import { LeadStatusPanel } from "@/components/leads/LeadStatusPanel";
import { DoNotCallToggle } from "@/components/leads/DoNotCallToggle";
import { LeadOwnerControl } from "@/components/leads/LeadOwnerControl";
import { CallSessionPanel } from "@/components/leads/CallSessionPanel";
import { CallHistoryList } from "@/components/leads/CallHistoryList";
import { FollowUpsPanel } from "@/components/leads/FollowUpsPanel";
import { HandoffPanel } from "@/components/leads/HandoffPanel";
import { requireEmployee, isAdmin, canManageLead } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_TONE = {
  NEW: "neutral",
  READY_TO_CALL: "neutral",
  CONTACTED: "warning",
  QUALIFIED: "warning",
  MEETING_BOOKED: "warning",
  PROPOSAL_SENT: "warning",
  WON: "success",
  LOST: "danger",
  DISQUALIFIED: "danger",
} as const;

const STATUS_LABEL = {
  NEW: "New",
  READY_TO_CALL: "Ready to call",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  MEETING_BOOKED: "Meeting booked",
  PROPOSAL_SENT: "Proposal sent",
  WON: "Won",
  LOST: "Lost",
  DISQUALIFIED: "Disqualified",
} as const;

export default async function LeadDetailPage({ params }: PageProps<"/leads/[id]">) {
  const employee = await requireEmployee();
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      businessName: true,
      industry: true,
      city: true,
      area: true,
      contactName: true,
      contactRole: true,
      phone: true,
      whatsapp: true,
      email: true,
      website: true,
      source: true,
      notes: true,
      onlinePresence: true,
      identifiedNeeds: true,
      priority: true,
      status: true,
      doNotCall: true,
      doNotCallReason: true,
      ownerId: true,
      owner: { select: { fullName: true } },
      createdBy: { select: { fullName: true } },
      nextFollowUpDate: true,
      nextAction: true,
      handoffStatus: true,
      handoffContext: true,
      meetingHeldAt: true,
      createdAt: true,
      calls: {
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          attemptNumber: true,
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
          outcome: true,
          decisionMakerReached: true,
          interestLevel: true,
          notes: true,
          callerId: true,
          caller: { select: { fullName: true } },
        },
      },
      followUps: {
        orderBy: { dueDate: "asc" },
        select: { id: true, dueDate: true, action: true, status: true },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  if (!canManageLead(employee, lead) && !isAdmin(employee.role)) {
    redirect("/leads");
  }

  const activeCall = lead.calls.find((c) => c.callerId === employee.id && c.endedAt === null) ?? null;

  const [callers, founders] = await Promise.all([
    isAdmin(employee.role)
      ? prisma.employee.findMany({
          where: { role: "CALL_CALLER", employmentStatus: "ACTIVE" },
          orderBy: { fullName: "asc" },
          select: { id: true, fullName: true },
        })
      : Promise.resolve([]),
    prisma.employee.findMany({
      where: { role: { in: ["SUPER_ADMIN", "HR_MANAGER", "MANAGER"] }, employmentStatus: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={lead.businessName}
        description={[lead.contactName, lead.city].filter(Boolean).join(" · ") || undefined}
        actions={<StatusBadge label={STATUS_LABEL[lead.status]} tone={STATUS_TONE[lead.status]} />}
      />
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-xs text-foreground-muted">Pipeline status</h2>
            <LeadStatusPanel leadId={lead.id} status={lead.status} />
          </div>

          <DoNotCallToggle leadId={lead.id} doNotCall={lead.doNotCall} reason={lead.doNotCallReason} />

          {isAdmin(employee.role) ? (
            <div className="rounded-lg border border-border bg-surface p-4">
              <LeadOwnerControl leadId={lead.id} ownerId={lead.ownerId} callers={callers} />
            </div>
          ) : (
            <Field label="Owner" value={lead.owner?.fullName ?? "Unassigned"} />
          )}

          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-xs text-foreground-muted">Lead details</h2>
            <div className="mb-4 grid grid-cols-1 gap-2 text-sm">
              <Field label="Industry" value={lead.industry ?? "—"} />
              <Field label="Area" value={lead.area ?? "—"} />
              <Field label="Contact role" value={lead.contactRole ?? "—"} />
              <Field label="Phone" value={lead.phone ?? "—"} />
              <Field label="WhatsApp" value={lead.whatsapp ?? "—"} />
              <Field label="Email" value={lead.email ?? "—"} />
              <Field label="Website" value={lead.website ?? "—"} />
              <Field label="Source" value={lead.source ?? "—"} />
              <Field label="Added by" value={lead.createdBy.fullName} />
            </div>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-foreground-muted">
                Edit lead
              </summary>
              <div className="mt-4">
                <EditLeadForm
                  leadId={lead.id}
                  defaults={{
                    businessName: lead.businessName,
                    industry: lead.industry ?? "",
                    city: lead.city ?? "",
                    area: lead.area ?? "",
                    contactName: lead.contactName ?? "",
                    contactRole: lead.contactRole ?? "",
                    phone: lead.phone ?? "",
                    whatsapp: lead.whatsapp ?? "",
                    email: lead.email ?? "",
                    website: lead.website ?? "",
                    source: lead.source ?? "",
                    notes: lead.notes ?? "",
                    onlinePresence: lead.onlinePresence ?? "",
                    identifiedNeeds: lead.identifiedNeeds ?? "",
                    priority: lead.priority ?? "",
                  }}
                />
              </div>
            </details>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <CallSessionPanel
            leadId={lead.id}
            activeCallId={activeCall?.id ?? null}
            activeCallStartedAt={activeCall?.startedAt ?? null}
            doNotCall={lead.doNotCall}
          />

          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-xs text-foreground-muted">Call history</h2>
            <CallHistoryList calls={lead.calls} />
          </div>

          <FollowUpsPanel leadId={lead.id} followUps={lead.followUps} />

          <HandoffPanel
            leadId={lead.id}
            handoffStatus={lead.handoffStatus}
            handoffContext={lead.handoffContext}
            meetingHeldAt={lead.meetingHeldAt}
            viewerIsAdmin={isAdmin(employee.role)}
            founders={founders}
          />
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
