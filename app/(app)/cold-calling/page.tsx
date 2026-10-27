import Link from "next/link";
import { CalendarClock, PhoneOutgoing, Sparkles, ArrowRightCircle } from "lucide-react";
import type { ColdLeadStatus, Prisma } from "@prisma/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ColdLeadCard } from "@/components/cold-calling/ColdLeadCard";
import { AddColdLeadButton } from "@/components/cold-calling/AddColdLeadModal";
import { requireEmployee, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CLOSED_COLD_STATUSES,
  COLD_STATUS_LABEL,
  COLD_STATUS_ORDER,
  endOfTodayPkt,
  startOfTodayPkt,
} from "@/lib/coldCalling";

const LIST_LIMIT = 200;

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ColdCallingPage({ searchParams }: PageProps<"/cold-calling">) {
  const params = await searchParams;
  const employee = await requireEmployee();
  const viewerIsAdmin = isAdmin(employee.role);

  const status = COLD_STATUS_ORDER.find((s) => s === firstParam(params.status));
  const q = firstParam(params.q).trim().slice(0, 100);
  // "Due" (the default) is the calling queue; picking a status or searching
  // switches to the full list.
  const view = status || q || firstParam(params.view) === "all" ? "all" : "due";

  const now = new Date();
  const endOfToday = endOfTodayPkt(now);
  const scope: Prisma.ColdLeadWhereInput = viewerIsAdmin ? {} : { ownerId: employee.id };
  // Not closed, and either no follow-up set (new, no answer, details to
  // send…) or one that falls today or earlier.
  const dueWhere: Prisma.ColdLeadWhereInput = {
    ...scope,
    status: { notIn: CLOSED_COLD_STATUSES },
    OR: [{ followUpAt: null }, { followUpAt: { lt: endOfToday } }],
  };

  const listWhere: Prisma.ColdLeadWhereInput =
    view === "due"
      ? dueWhere
      : {
          AND: [
            scope,
            status ? { status } : {},
            q
              ? {
                  OR: [
                    { businessName: { contains: q, mode: "insensitive" } },
                    { contactName: { contains: q, mode: "insensitive" } },
                    { category: { contains: q, mode: "insensitive" } },
                    { area: { contains: q, mode: "insensitive" } },
                    { city: { contains: q, mode: "insensitive" } },
                    { phone: { contains: q.replace(/[^\d+]/g, "") || q } },
                  ],
                }
              : {},
          ],
        };

  const [statusCounts, dueCount, callsToday, leads] = await Promise.all([
    prisma.coldLead.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
    prisma.coldLead.count({ where: dueWhere }),
    prisma.coldCallLog.count({
      where: {
        ...(viewerIsAdmin ? {} : { callerId: employee.id }),
        outcome: { not: "DETAILS_SENT" },
        createdAt: { gte: startOfTodayPkt(now) },
      },
    }),
    prisma.coldLead.findMany({
      where: listWhere,
      orderBy:
        view === "due"
          ? [{ followUpAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }]
          : [{ updatedAt: "desc" }],
      take: LIST_LIMIT,
      select: {
        id: true,
        businessName: true,
        category: true,
        city: true,
        area: true,
        phone: true,
        whatsapp: true,
        source: true,
        status: true,
        followUpAt: true,
        owner: { select: { fullName: true } },
        logs: { orderBy: { createdAt: "desc" }, take: 1, select: { notes: true } },
      },
    }),
  ]);

  const countByStatus = new Map<ColdLeadStatus, number>(statusCounts.map((c) => [c.status, c._count._all]));
  const total = statusCounts.reduce((sum, c) => sum + c._count._all, 0);

  function chipHref(next: { view?: "all"; status?: ColdLeadStatus }) {
    const sp = new URLSearchParams();
    if (next.view) sp.set("view", next.view);
    if (next.status) sp.set("status", next.status);
    const qs = sp.toString();
    return qs ? `/cold-calling?${qs}` : "/cold-calling";
  }

  return (
    <>
      <PageHeader
        title="Cold calling"
        description={`${total} ${total === 1 ? "business" : "businesses"} · ${dueCount} due today`}
        actions={
          <AddColdLeadButton className="flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90" />
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Calls today" value={callsToday} icon={PhoneOutgoing} />
          <StatCard label="Due today" value={dueCount} icon={CalendarClock} tone="amber" />
          <StatCard label="Interested" value={countByStatus.get("INTERESTED") ?? 0} icon={Sparkles} tone="success" />
          <StatCard
            label="Moved to Leads"
            value={countByStatus.get("CONVERTED") ?? 0}
            icon={ArrowRightCircle}
            tone="info"
          />
        </div>

        <nav aria-label="Funnel stages" className="flex flex-wrap gap-2">
          <Chip href={chipHref({})} active={view === "due"} label="Due today" count={dueCount} />
          <Chip href={chipHref({ view: "all" })} active={view === "all" && !status && !q} label="All" count={total} />
          {COLD_STATUS_ORDER.map((s) => (
            <Chip
              key={s}
              href={chipHref({ status: s })}
              active={status === s}
              label={COLD_STATUS_LABEL[s]}
              count={countByStatus.get(s) ?? 0}
            />
          ))}
        </nav>

        <form method="get" action="/cold-calling" className="flex flex-wrap items-center gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search business, person, area, phone"
            aria-label="Search businesses"
            className="h-8 w-full rounded-sm border border-border-strong bg-surface px-2 text-sm text-foreground sm:w-72"
          />
          <button
            type="submit"
            className="h-8 rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
          >
            Search
          </button>
          {q ? (
            <Link href={chipHref({ status })} className="text-sm text-foreground-muted hover:text-foreground">
              Clear
            </Link>
          ) : null}
        </form>

        {leads.length === 0 ? (
          <EmptyState view={view} hasAny={total > 0} />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {leads.map((lead) => (
                <ColdLeadCard key={lead.id} lead={lead} showOwner={viewerIsAdmin} now={now} />
              ))}
            </ul>
            {leads.length === LIST_LIMIT ? (
              <p className="text-center text-xs text-foreground-muted">
                Showing the first {LIST_LIMIT} — search or pick a stage to narrow it down.
              </p>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

function Chip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${
        active
          ? "border-accent bg-accent/12 font-medium text-accent"
          : "border-border text-foreground-muted hover:bg-overlay-hover hover:text-foreground"
      }`}
    >
      {label}
      <span className="text-xs tabular-nums opacity-80">{count}</span>
    </Link>
  );
}

function EmptyState({ view, hasAny }: { view: "due" | "all"; hasAny: boolean }) {
  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No businesses yet</p>
        <p className="max-w-sm text-sm text-foreground-muted">
          Found a business on Google Maps or got a reference? Add it here, call them, and log what they said.
        </p>
        <AddColdLeadButton className="mt-2 flex h-9 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90" />
      </div>
    );
  }
  return (
    <p className="py-12 text-center text-sm text-foreground-muted">
      {view === "due" ? "Nothing due right now — add a new business or check back later." : "Nothing matches."}
    </p>
  );
}
