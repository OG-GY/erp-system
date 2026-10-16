import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { LeadBoard } from "@/components/leads/LeadBoard";
import { LeadTable } from "@/components/leads/LeadTable";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { requireEmployee, isAdmin, isCallCaller } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const leadSelect = {
  id: true,
  businessName: true,
  city: true,
  contactName: true,
  businessOwnerName: true,
  phone: true,
  status: true,
  simCallStatus: true,
  priority: true,
  doNotCall: true,
  nextFollowUpDate: true,
  owner: { select: { id: true, fullName: true } },
  _count: { select: { calls: true } },
} as const;

const STATUS_OPTIONS = [
  ["NEW", "New"],
  ["READY_TO_CALL", "Ready to call"],
  ["CONTACTED", "Contacted"],
  ["QUALIFIED", "Qualified"],
  ["MEETING_BOOKED", "Meeting booked"],
  ["PROPOSAL_SENT", "Proposal sent"],
  ["WON", "Won"],
  ["LOST", "Lost"],
  ["DISQUALIFIED", "Disqualified"],
] as const;
const PRIORITY_OPTIONS = [
  ["HIGH", "High"],
  ["MEDIUM", "Medium"],
  ["LOW", "Low"],
] as const;

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const params = await searchParams;
  const isTableView = firstParam(params.view) === "table";
  const q = firstParam(params.q).trim().slice(0, 100);
  const status = STATUS_OPTIONS.find(([v]) => v === firstParam(params.status))?.[0] ?? "";
  const priority = PRIORITY_OPTIONS.find(([v]) => v === firstParam(params.priority))?.[0] ?? "";
  const ownerParam = firstParam(params.owner);
  const simCall = firstParam(params.simCall) === "1";
  const overdue = firstParam(params.overdue) === "1";

  const employee = await requireEmployee();
  if (!isAdmin(employee.role) && !isCallCaller(employee.role)) {
    redirect("/dashboard");
  }
  const viewerIsAdmin = isAdmin(employee.role);
  const owner = viewerIsAdmin ? ownerParam : "";
  const hasFilters = !!(q || status || priority || owner || simCall || overdue);
  const today = new Date(new Date().toISOString().slice(0, 10));

  const [leads, callers] = await Promise.all([
    prisma.lead.findMany({
      where: {
        AND: [
          viewerIsAdmin ? {} : { OR: [{ ownerId: employee.id }, { ownerId: null }] },
          q
            ? {
                OR: [
                  { businessName: { contains: q, mode: "insensitive" } },
                  { businessOwnerName: { contains: q, mode: "insensitive" } },
                  { contactName: { contains: q, mode: "insensitive" } },
                  { phone: { contains: q } },
                  { city: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          status ? { status } : {},
          priority ? { priority } : {},
          owner === "unassigned" ? { ownerId: null } : owner ? { ownerId: owner } : {},
          simCall ? { simCallStatus: { in: ["NEEDS_SIM_CALL", "ATTEMPTED", "UNREACHABLE"] } } : {},
          overdue ? { nextFollowUpDate: { lt: today } } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: leadSelect,
    }),
    viewerIsAdmin
      ? prisma.employee.findMany({
          where: { role: "CALL_CALLER", employmentStatus: "ACTIVE" },
          orderBy: { fullName: "asc" },
          select: { id: true, fullName: true },
        })
      : Promise.resolve([]),
  ]);

  function viewHref(view: "board" | "table") {
    const sp = new URLSearchParams();
    if (view === "table") sp.set("view", "table");
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (priority) sp.set("priority", priority);
    if (owner) sp.set("owner", owner);
    if (simCall) sp.set("simCall", "1");
    if (overdue) sp.set("overdue", "1");
    const qs = sp.toString();
    return qs ? `/leads?${qs}` : "/leads";
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${leads.length} ${leads.length === 1 ? "lead" : "leads"}`}
        actions={
          <>
            <Link
              href="/leads/sim-calls"
              className="flex h-8 items-center rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
            >
              SIM calls needed
            </Link>
            <Link
              href="/leads/import"
              className="flex h-8 items-center rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
            >
              Import CSV
            </Link>
            <Link
              href="/leads/new"
              className="flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              New lead
            </Link>
          </>
        }
      />
      <div className="p-4 sm:p-6">
        {leads.length === 0 && !hasFilters ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No leads yet</p>
            <div className="mt-2 flex gap-2">
              <Link
                href="/leads/import"
                className="flex h-9 items-center rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
              >
                Import CSV
              </Link>
              <Link
                href="/leads/new"
                className="flex h-9 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                New lead
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="View mode">
              <Link
                href={viewHref("board")}
                aria-current={isTableView ? undefined : "page"}
                className={`rounded-sm px-3 py-1 font-medium ${isTableView ? "text-foreground-muted hover:text-foreground" : "bg-overlay-hover text-foreground"}`}
              >
                Board
              </Link>
              <Link
                href={viewHref("table")}
                aria-current={isTableView ? "page" : undefined}
                className={`rounded-sm px-3 py-1 font-medium ${isTableView ? "bg-overlay-hover text-foreground" : "text-foreground-muted hover:text-foreground"}`}
              >
                Table
              </Link>
            </div>
            <LeadFilters
              isTableView={isTableView}
              values={{ q, status, priority, owner, simCall, overdue }}
              statusOptions={STATUS_OPTIONS}
              priorityOptions={PRIORITY_OPTIONS}
              callers={callers}
              hasFilters={hasFilters}
            />
            {leads.length === 0 ? (
              <p className="py-12 text-center text-sm text-foreground-muted">No leads match these filters.</p>
            ) : isTableView ? (
              <LeadTable leads={leads} showOwner={viewerIsAdmin} />
            ) : (
              <LeadBoard leads={leads} showOwner={viewerIsAdmin} canDragAll />
            )}
          </>
        )}
      </div>
    </>
  );
}
