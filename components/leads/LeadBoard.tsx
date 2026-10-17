"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions/leads";
import { LeadCard } from "@/components/leads/LeadCard";
import { useToast } from "@/components/ui/Toast";

const COLUMNS = [
  { status: "NEW", label: "New" },
  { status: "READY_TO_CALL", label: "Ready to call" },
  { status: "CONTACTED", label: "Contacted" },
  { status: "QUALIFIED", label: "Qualified" },
  { status: "MEETING_BOOKED", label: "Meeting booked" },
  { status: "PROPOSAL_SENT", label: "Proposal sent" },
  { status: "WON", label: "Won" },
  { status: "LOST", label: "Lost" },
  { status: "DISQUALIFIED", label: "Disqualified" },
] as const;

// Dropping on Lost/Disqualified needs a reason, which the board doesn't
// collect — those columns just open the lead's full page instead of
// completing the move, where the status control requires the reason.
const REASON_REQUIRED_STATUSES = new Set(["LOST", "DISQUALIFIED"]);

const COLUMN_STYLES: Record<(typeof COLUMNS)[number]["status"], { bar: string; dot: string; wash: string }> = {
  NEW: { bar: "border-t-info", dot: "bg-info", wash: "bg-info/5" },
  READY_TO_CALL: { bar: "border-t-accent", dot: "bg-accent", wash: "bg-accent/5" },
  CONTACTED: { bar: "border-t-warning", dot: "bg-warning", wash: "bg-warning/5" },
  QUALIFIED: { bar: "border-t-accent-secondary", dot: "bg-accent-secondary", wash: "bg-accent-secondary/5" },
  MEETING_BOOKED: { bar: "border-t-accent", dot: "bg-accent", wash: "bg-accent/5" },
  PROPOSAL_SENT: { bar: "border-t-warning", dot: "bg-warning", wash: "bg-warning/5" },
  WON: { bar: "border-t-success", dot: "bg-success", wash: "bg-success/5" },
  LOST: { bar: "border-t-danger", dot: "bg-danger", wash: "bg-danger/5" },
  DISQUALIFIED: { bar: "border-t-danger", dot: "bg-danger", wash: "bg-danger/5" },
};

type Lead = {
  id: string;
  businessName: string;
  city: string | null;
  contactName: string | null;
  status: string;
  simCallStatus: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | null;
  doNotCall: boolean;
  nextFollowUpDate: Date | null;
  owner: { id: string; fullName: string } | null;
  _count: { calls: number };
};

export function LeadBoard({
  leads: initialLeads,
  showOwner,
  canDragAll,
}: {
  leads: Lead[];
  showOwner: boolean;
  /** Admins (and a caller for their own leads, enforced server-side regardless) can drag any card. */
  canDragAll: boolean;
}) {
  const router = useRouter();
  const { run } = useToast();
  const [leads, setLeads] = useState(initialLeads);
  const [prevInitialLeads, setPrevInitialLeads] = useState(initialLeads);
  if (initialLeads !== prevInitialLeads) {
    setPrevInitialLeads(initialLeads);
    setLeads(initialLeads);
  }

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const todayIso = new Date().toISOString().slice(0, 10);

  function handleDrop(status: string) {
    setDragOverStatus(null);
    if (!draggedId) return;
    const id = draggedId;
    setDraggedId(null);
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;

    if (REASON_REQUIRED_STATUSES.has(status)) {
      router.push(`/leads/${id}`);
      return;
    }

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("status", status);
      await run(() => updateLeadStatus(id, { error: null }, fd));
      router.refresh();
    });
  }

  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
      {COLUMNS.map((column) => {
        const items = leads.filter((l) => l.status === column.status);
        const isDragOver = dragOverStatus === column.status;
        const styles = COLUMN_STYLES[column.status];

        return (
          <div
            key={column.status}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverStatus !== column.status) setDragOverStatus(column.status);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === column.status ? null : s))}
            onDrop={() => handleDrop(column.status)}
            className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-t-4 p-3 transition-colors ${styles.bar} ${
              isDragOver ? "border-accent bg-accent/10" : `border-border ${styles.wash}`
            }`}
          >
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden="true" />
                <p className="text-xs font-medium text-foreground-muted">{column.label}</p>
              </span>
              <span className="text-xs text-foreground-muted">{items.length}</span>
            </div>

            <div className="flex min-h-[4rem] flex-col gap-2">
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-foreground-muted">
                  No leads
                </p>
              ) : (
                items.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    todayIso={todayIso}
                    showOwner={showOwner}
                    canDrag={canDragAll}
                    onDragStart={() => setDraggedId(lead.id)}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverStatus(null);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
