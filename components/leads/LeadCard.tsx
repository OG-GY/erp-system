"use client";

import Link from "next/link";
import { PhoneOff, Clock, Signal } from "lucide-react";

const PRIORITY_DOT = {
  LOW: "bg-overlay-neutral",
  MEDIUM: "bg-warning",
  HIGH: "bg-danger",
} as const;

type Lead = {
  id: string;
  businessName: string;
  city: string | null;
  contactName: string | null;
  simCallStatus?: string | null;
  priority: keyof typeof PRIORITY_DOT | null;
  doNotCall: boolean;
  nextFollowUpDate: Date | null;
  owner: { id: string; fullName: string } | null;
  _count: { calls: number };
};

export function LeadCard({
  lead,
  todayIso,
  showOwner,
  canDrag,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead;
  todayIso: string;
  showOwner: boolean;
  canDrag: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const followUpIso = lead.nextFollowUpDate
    ? lead.nextFollowUpDate.toISOString().slice(0, 10)
    : null;
  const isOverdue = followUpIso !== null && followUpIso < todayIso;

  return (
    <Link
      href={`/leads/${lead.id}`}
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      onDragEnd={canDrag ? onDragEnd : undefined}
      className={`flex flex-col gap-1 rounded-md border border-border bg-surface p-3 text-left text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md ${
        canDrag ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <span className="flex items-center gap-1.5 font-medium text-foreground">
        {lead.priority ? (
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[lead.priority]}`} aria-hidden="true" />
        ) : null}
        <span className="truncate">{lead.businessName}</span>
      </span>
      {lead.contactName || lead.city ? (
        <span className="truncate text-xs text-foreground-muted">
          {[lead.contactName, lead.city].filter(Boolean).join(" · ")}
        </span>
      ) : null}

      <div className="mt-1 flex items-center justify-between text-xs text-foreground-muted">
        <span className={`flex items-center gap-1 ${isOverdue ? "font-medium text-danger" : ""}`}>
          {followUpIso ? (
            <>
              <Clock className="h-3 w-3" aria-hidden="true" />
              {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
                lead.nextFollowUpDate!,
              )}
            </>
          ) : null}
        </span>
        <span className="flex items-center gap-2">
          {lead.doNotCall ? <PhoneOff className="h-3 w-3 text-danger" aria-label="Do not call" /> : null}
          {lead.simCallStatus && lead.simCallStatus !== "RESOLVED" ? (
            <Signal className="h-3 w-3 text-warning" aria-label="Needs a SIM/local call" />
          ) : null}
          {lead._count.calls > 0 ? <span>{lead._count.calls} calls</span> : null}
        </span>
      </div>

      {showOwner ? (
        <span className="truncate text-xs text-accent">
          {lead.owner ? lead.owner.fullName : "Unassigned"}
        </span>
      ) : null}
    </Link>
  );
}
