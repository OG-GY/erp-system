import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ColdLeadForm } from "@/components/cold-calling/ColdLeadForm";
import { LogCallForm } from "@/components/cold-calling/LogCallForm";
import { ContactButtons, FollowUpLabel } from "@/components/cold-calling/ColdLeadCard";
import { ConvertColdLeadButton, DeleteColdLeadButton } from "@/components/cold-calling/ColdLeadActions";
import { requireEmployee, isAdmin, isCallCaller, canManageColdLead } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { COLD_SOURCE_LABEL, COLD_STATUS_LABEL, COLD_STATUS_TONE } from "@/lib/coldCalling";

export default async function ColdLeadDetailPage({ params }: PageProps<"/cold-calling/[id]">) {
  const employee = await requireEmployee();
  const { id } = await params;

  const lead = await prisma.coldLead.findUnique({
    where: { id },
    include: {
      owner: { select: { fullName: true } },
      logs: {
        orderBy: { createdAt: "desc" },
        include: { caller: { select: { fullName: true } } },
      },
    },
  });
  if (!lead) notFound();
  if (!canManageColdLead(employee, lead)) redirect("/cold-calling");

  const now = new Date();
  const canOpenLeads = isAdmin(employee.role) || isCallCaller(employee.role);
  const callCount = lead.logs.filter((l) => l.outcome !== "DETAILS_SENT").length;

  return (
    <>
      <PageHeader
        title={lead.businessName}
        description={[lead.contactName, lead.category, lead.city].filter(Boolean).join(" · ") || undefined}
        actions={<StatusBadge label={COLD_STATUS_LABEL[lead.status]} tone={COLD_STATUS_TONE[lead.status]} />}
      />
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
            <h2 className="text-xs text-foreground-muted">Contact</h2>
            <ContactButtons phone={lead.phone} whatsapp={lead.whatsapp} />
            <FollowUpLabel followUpAt={lead.followUpAt} now={now} />
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <Field label="Area" value={[lead.area, lead.city].filter(Boolean).join(", ") || "—"} />
              <Field label="Found via" value={COLD_SOURCE_LABEL[lead.source]} />
              {lead.sourceDetail ? <Field label="Maps link / referred by" value={lead.sourceDetail} /> : null}
              <Field label="Calls made" value={String(callCount)} />
              <Field label="Last called" value={lead.lastCalledAt ? formatDateTime(lead.lastCalledAt) : "—"} />
              <Field label="Added by" value={`${lead.owner.fullName} · ${formatDateTime(lead.createdAt)}`} />
              {lead.notes ? <Field label="Notes" value={lead.notes} /> : null}
            </dl>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-foreground-muted">Edit details</summary>
              <div className="mt-4">
                <ColdLeadForm
                  coldLeadId={lead.id}
                  defaults={{
                    businessName: lead.businessName,
                    phone: lead.phone,
                    whatsapp: lead.whatsapp ?? "",
                    category: lead.category ?? "",
                    city: lead.city ?? "",
                    area: lead.area ?? "",
                    contactName: lead.contactName ?? "",
                    source: lead.source,
                    sourceDetail: lead.sourceDetail ?? "",
                    notes: lead.notes ?? "",
                  }}
                />
              </div>
            </details>
            <DeleteColdLeadButton coldLeadId={lead.id} />
          </section>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {lead.status === "CONVERTED" ? (
            <section className="rounded-lg border border-success/40 bg-success/5 p-4">
              <p className="text-sm font-medium text-foreground">Moved to the Leads pipeline.</p>
              {canOpenLeads && lead.convertedLeadId ? (
                <Link href={`/leads/${lead.convertedLeadId}`} className="text-sm text-accent hover:underline">
                  Open the lead
                </Link>
              ) : (
                <p className="text-sm text-foreground-muted">The calling team takes it from here.</p>
              )}
            </section>
          ) : (
            <>
              <section className="rounded-lg border border-border bg-surface p-4">
                <h2 className="mb-3 text-xs text-foreground-muted">Log a call</h2>
                <LogCallForm coldLeadId={lead.id} currentStatus={lead.status} />
              </section>
              {lead.status === "INTERESTED" ? (
                <section className="flex flex-col gap-2 rounded-lg border border-success/40 bg-success/5 p-4">
                  <p className="text-sm text-foreground">
                    They&apos;re interested — move them into the Leads pipeline to book a meeting and close.
                  </p>
                  <ConvertColdLeadButton coldLeadId={lead.id} />
                </section>
              ) : null}
            </>
          )}

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-xs text-foreground-muted">History</h2>
            {lead.logs.length === 0 ? (
              <p className="text-sm text-foreground-muted">Not called yet.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {lead.logs.map((log) => (
                  <li key={log.id} className="border-l-2 border-border pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={COLD_STATUS_LABEL[log.outcome]} tone={COLD_STATUS_TONE[log.outcome]} />
                      <span className="text-xs text-foreground-muted">
                        {formatDateTime(log.createdAt)} · {log.caller.fullName}
                      </span>
                    </div>
                    {log.notes ? <p className="mt-1 whitespace-pre-line text-sm text-foreground">{log.notes}</p> : null}
                    {log.followUpAt ? (
                      <p className="mt-1 text-xs text-foreground-muted">Follow up: {formatDateTime(log.followUpAt)}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}
