"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  flagLeadNeedsSimCall,
  updateLeadSimCallStatus,
  clearLeadSimCallFlag,
} from "@/lib/actions/leads";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";

const STATUS_OPTIONS = [
  { value: "NEEDS_SIM_CALL", label: "Needs SIM call" },
  { value: "ATTEMPTED", label: "Attempted" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "UNREACHABLE", label: "Still unreachable" },
];

const STATUS_TONE = {
  NEEDS_SIM_CALL: "warning",
  ATTEMPTED: "neutral",
  RESOLVED: "success",
  UNREACHABLE: "danger",
} as const;

const STATUS_LABEL: Record<string, string> = {
  NEEDS_SIM_CALL: "Needs SIM call",
  ATTEMPTED: "Attempted",
  RESOLVED: "Resolved",
  UNREACHABLE: "Still unreachable",
};

export function SimCallPanel({
  leadId,
  simCallStatus,
  simCallNote,
}: {
  leadId: string;
  simCallStatus: string | null;
  simCallNote: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [noteInput, setNoteInput] = useState("");

  function confirmFlag() {
    startTransition(async () => {
      await flagLeadNeedsSimCall(leadId, noteInput || null);
      setShowFlagInput(false);
      router.refresh();
    });
  }

  function changeStatus(status: string) {
    startTransition(async () => {
      await updateLeadSimCallStatus(leadId, status);
      router.refresh();
    });
  }

  function clearFlag() {
    startTransition(async () => {
      await clearLeadSimCallFlag(leadId);
      router.refresh();
    });
  }

  if (simCallStatus === null) {
    if (showFlagInput) {
      return (
        <div className="flex flex-col gap-2 rounded-md border border-warning/30 p-3">
          <p className="text-sm font-medium text-foreground">Flag — unreachable on WhatsApp</p>
          <Input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Note (optional)"
            disabled={isPending}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFlagInput(false)}
              disabled={isPending}
              className="h-8 rounded-sm border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmFlag}
              disabled={isPending}
              className="h-8 rounded-sm bg-warning px-3 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
        <p className="text-sm font-medium text-foreground">Reachable on WhatsApp</p>
        <button
          type="button"
          onClick={() => setShowFlagInput(true)}
          disabled={isPending}
          className="h-8 shrink-0 rounded-sm border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
        >
          Flag needs SIM call
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge label={STATUS_LABEL[simCallStatus] ?? simCallStatus} tone={STATUS_TONE[simCallStatus as keyof typeof STATUS_TONE] ?? "neutral"} />
        <button
          type="button"
          onClick={clearFlag}
          disabled={isPending}
          className="text-xs text-foreground-muted hover:text-danger disabled:opacity-60"
        >
          Clear flag
        </button>
      </div>
      {simCallNote ? <p className="text-xs text-foreground-muted">{simCallNote}</p> : null}
      <Select
        value={simCallStatus}
        onChange={changeStatus}
        disabled={isPending}
        options={STATUS_OPTIONS}
      />
    </div>
  );
}
