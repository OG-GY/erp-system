"use client";

import { useActionState, useTransition } from "react";
import {
  requestHandoff,
  updateHandoffStatus,
  markMeetingHeld,
  type RequestHandoffState,
} from "@/lib/actions/leads";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorToast } from "@/components/ui/Toast";
import { useToast } from "@/components/ui/Toast";

const STATUS_TONE = {
  NONE: "neutral",
  PENDING: "warning",
  SENT: "warning",
  ACCEPTED: "success",
  COMPLETED: "success",
} as const;

const STATUS_LABEL = {
  NONE: "No handoff",
  PENDING: "Pending",
  SENT: "Sent to founder",
  ACCEPTED: "Accepted",
  COMPLETED: "Completed",
} as const;

const initialState: RequestHandoffState = { error: null };

export function HandoffPanel({
  leadId,
  handoffStatus,
  handoffContext,
  meetingHeldAt,
  viewerIsAdmin,
  founders,
}: {
  leadId: string;
  handoffStatus: keyof typeof STATUS_LABEL;
  handoffContext: string | null;
  meetingHeldAt: Date | null;
  viewerIsAdmin: boolean;
  founders: { id: string; fullName: string }[];
}) {
  const { run } = useToast();
  const [isPending, startTransition] = useTransition();

  function setStatus(status: string) {
    startTransition(async () => {
      await run(() => updateHandoffStatus(leadId, status));
    });
  }

  function confirmMeetingHeld() {
    startTransition(async () => {
      await run(() => markMeetingHeld(leadId));
    });
  }

  if (handoffStatus === "NONE") {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-3 text-xs text-foreground-muted">Founder handoff</p>
        <RequestHandoffForm leadId={leadId} founders={founders} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-foreground-muted">Founder handoff</p>
        <StatusBadge label={STATUS_LABEL[handoffStatus]} tone={STATUS_TONE[handoffStatus]} />
      </div>
      {handoffContext ? (
        <p className="mb-3 whitespace-pre-wrap text-sm text-foreground">{handoffContext}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {handoffStatus === "PENDING" ? (
          <button
            type="button"
            onClick={() => setStatus("SENT")}
            disabled={isPending}
            className="h-8 rounded-sm border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
          >
            Mark sent to founder
          </button>
        ) : null}
        {viewerIsAdmin && (handoffStatus === "PENDING" || handoffStatus === "SENT") ? (
          <button
            type="button"
            onClick={() => setStatus("ACCEPTED")}
            disabled={isPending}
            className="h-8 rounded-sm border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
          >
            Accept
          </button>
        ) : null}
        {viewerIsAdmin && handoffStatus === "ACCEPTED" ? (
          <>
            {!meetingHeldAt ? (
              <button
                type="button"
                onClick={confirmMeetingHeld}
                disabled={isPending}
                className="h-8 rounded-sm border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
              >
                Confirm meeting held
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setStatus("COMPLETED")}
              disabled={isPending}
              className="h-8 rounded-sm bg-accent px-3 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Mark complete
            </button>
          </>
        ) : null}
      </div>
      {meetingHeldAt ? (
        <p className="mt-2 text-xs text-foreground-muted">Meeting confirmed held.</p>
      ) : null}
    </div>
  );
}

function RequestHandoffForm({
  leadId,
  founders,
}: {
  leadId: string;
  founders: { id: string; fullName: string }[];
}) {
  const boundAction = requestHandoff.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Textarea
        name="handoffContext"
        required
        rows={4}
        placeholder="Summarize the opportunity: the business problem, decision-maker, interest level, objections, and proposed next step."
        disabled={isPending}
      />
      {founders.length > 0 ? (
        <Select
          name="handoffToId"
          defaultValue=""
          placeholder="Hand off to…"
          options={[
            { value: "", label: "Any admin" },
            ...founders.map((f) => ({ value: f.id, label: f.fullName })),
          ]}
          disabled={isPending}
        />
      ) : null}
      <ErrorToast message={state.error} trigger={state} />
      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Requesting…" : "Request handoff"}
      </button>
    </form>
  );
}
