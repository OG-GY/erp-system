"use client";

import { useState, useTransition } from "react";
import { updateLeadSimCallStatus } from "@/lib/actions/leads";
import { LeadCard } from "@/components/leads/LeadCard";
import { useToast } from "@/components/ui/Toast";

const COLUMNS = [
  { status: "NEEDS_SIM_CALL", label: "Needs SIM call" },
  { status: "ATTEMPTED", label: "Attempted" },
  { status: "RESOLVED", label: "Resolved" },
  { status: "UNREACHABLE", label: "Still unreachable" },
] as const;

const COLUMN_STYLES: Record<(typeof COLUMNS)[number]["status"], { bar: string; dot: string; wash: string }> = {
  NEEDS_SIM_CALL: { bar: "border-t-warning", dot: "bg-warning", wash: "bg-warning/5" },
  ATTEMPTED: { bar: "border-t-accent", dot: "bg-accent", wash: "bg-accent/5" },
  RESOLVED: { bar: "border-t-success", dot: "bg-success", wash: "bg-success/5" },
  UNREACHABLE: { bar: "border-t-danger", dot: "bg-danger", wash: "bg-danger/5" },
};

type Lead = {
  id: string;
  businessName: string;
  city: string | null;
  contactName: string | null;
  simCallStatus: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | null;
  doNotCall: boolean;
  nextFollowUpDate: Date | null;
  owner: { id: string; fullName: string } | null;
  _count: { calls: number };
};

export function SimCallBoard({
  leads: initialLeads,
  showOwner,
  canDragAll,
}: {
  leads: Lead[];
  showOwner: boolean;
  canDragAll: boolean;
}) {
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
    if (!lead || lead.simCallStatus === status) return;

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, simCallStatus: status } : l)));
    startTransition(async () => {
      await run(() => updateLeadSimCallStatus(id, status));
    });
  }

  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
      {COLUMNS.map((column) => {
        const items = leads.filter((l) => l.simCallStatus === column.status);
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
