"use client";

import { useActionState, useState } from "react";
import { updateLeadStatus, type UpdateLeadStatusState } from "@/lib/actions/leads";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "READY_TO_CALL", label: "Ready to call" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "MEETING_BOOKED", label: "Meeting booked" },
  { value: "PROPOSAL_SENT", label: "Proposal sent" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
  { value: "DISQUALIFIED", label: "Disqualified" },
] as const;

const REASON_REQUIRED = new Set(["LOST", "DISQUALIFIED"]);

const initialState: UpdateLeadStatusState = { error: null };

export function LeadStatusPanel({ leadId, status }: { leadId: string; status: string }) {
  const boundAction = updateLeadStatus.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const [pendingStatus, setPendingStatus] = useState(status);

  const needsReason = REASON_REQUIRED.has(pendingStatus);
  const isWon = pendingStatus === "WON";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Select
        name="status"
        value={pendingStatus}
        onChange={setPendingStatus}
        options={STATUS_OPTIONS}
        disabled={isPending}
      />
      {needsReason ? (
        <Textarea
          name="reason"
          placeholder={
            pendingStatus === "LOST" ? "Why was this lead lost?" : "Why is this lead disqualified?"
          }
          rows={2}
          required
          disabled={isPending}
        />
      ) : null}
      {isWon ? (
        <Input
          name="dealValue"
          type="number"
          min="0"
          step="0.01"
          placeholder="Deal value (optional)"
          disabled={isPending}
        />
      ) : null}
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Update status"}
      </button>
    </form>
  );
}
