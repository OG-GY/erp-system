"use client";

import { useActionState, useState, useTransition } from "react";
import { startCallSession, cancelCallSession, endCallSession, type EndCallState } from "@/lib/actions/calls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { ErrorToast } from "@/components/ui/Toast";
import { useToast } from "@/components/ui/Toast";

const OUTCOME_OPTIONS = [
  { value: "NO_ANSWER", label: "No answer" },
  { value: "BUSY", label: "Busy" },
  { value: "VOICEMAIL", label: "Voicemail" },
  { value: "GATEKEEPER", label: "Gatekeeper" },
  { value: "DECISION_MAKER_REACHED", label: "Decision-maker reached" },
  { value: "INTERESTED", label: "Interested" },
  { value: "CALLBACK_REQUESTED", label: "Callback requested" },
  { value: "MEETING_BOOKED", label: "Meeting booked" },
  { value: "NOT_INTERESTED", label: "Not interested" },
  { value: "INVALID_NUMBER", label: "Invalid number" },
  { value: "DO_NOT_CALL", label: "Do not call" },
] as const;

const INTEREST_OPTIONS = [
  { value: "", label: "Interest not assessed" },
  { value: "LOW", label: "Low interest" },
  { value: "MEDIUM", label: "Medium interest" },
  { value: "HIGH", label: "High interest" },
] as const;

const NO_CONVERSATION_OUTCOMES = new Set(["NO_ANSWER", "BUSY", "VOICEMAIL", "INVALID_NUMBER"]);
const initialEndState: EndCallState = { error: null };

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  }).format(date);
}

export function CallSessionPanel({
  leadId,
  activeCallId,
  activeCallStartedAt,
  doNotCall,
}: {
  leadId: string;
  activeCallId: string | null;
  activeCallStartedAt: Date | null;
  doNotCall: boolean;
}) {
  const { run } = useToast();
  const [isStarting, startTransition] = useTransition();
  const [isCancelling, startCancelTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      await run(() => startCallSession(leadId));
    });
  }

  function handleDiscard() {
    if (!activeCallId) return;
    startCancelTransition(async () => {
      await run(() => cancelCallSession(activeCallId));
    });
  }

  if (!activeCallId) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-3 text-xs text-foreground-muted">Call</p>
        <button
          type="button"
          onClick={handleStart}
          disabled={isStarting || doNotCall}
          className="h-9 rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isStarting ? "Starting…" : "Start call"}
        </button>
        {doNotCall ? (
          <p className="mt-2 text-xs text-danger">This lead is marked do-not-call.</p>
        ) : (
          <p className="mt-2 text-xs text-foreground-muted">
            Dial on your phone, then start the session to track it here.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground-muted">
          Call in progress{activeCallStartedAt ? ` — started ${formatTime(activeCallStartedAt)}` : ""}
        </p>
        <button
          type="button"
          onClick={handleDiscard}
          disabled={isCancelling}
          className="text-xs font-medium text-foreground-muted hover:text-danger disabled:opacity-60"
        >
          {isCancelling ? "Discarding…" : "Discard (misclick)"}
        </button>
      </div>
      <EndCallForm callId={activeCallId} />
    </div>
  );
}

function EndCallForm({ callId }: { callId: string }) {
  const boundAction = endCallSession.bind(null, callId);
  const [state, formAction, isPending] = useActionState(boundAction, initialEndState);
  const [outcome, setOutcome] = useState<string>("NO_ANSWER");
  const reachedSomeone = !NO_CONVERSATION_OUTCOMES.has(outcome);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Select
        name="outcome"
        value={outcome}
        onChange={setOutcome}
        options={OUTCOME_OPTIONS}
        disabled={isPending}
      />

      {reachedSomeone ? (
        <>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="decisionMakerReached"
              value="true"
              disabled={isPending}
              className="h-4 w-4 rounded border-border-strong"
            />
            Reached the decision-maker
          </label>
          <Select
            name="interestLevel"
            defaultValue=""
            options={INTEREST_OPTIONS}
            disabled={isPending}
          />
          <Textarea name="painPoints" placeholder="Pain points" rows={2} disabled={isPending} />
          <Textarea name="objections" placeholder="Objections" rows={2} disabled={isPending} />
        </>
      ) : null}

      <Textarea name="notes" placeholder="Call notes / summary" rows={3} disabled={isPending} />
      <Input name="nextAction" placeholder="Next action" disabled={isPending} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nextFollowUpDate" className="text-xs text-foreground-muted">
          Next follow-up date
        </label>
        <Input id="nextFollowUpDate" name="nextFollowUpDate" type="date" disabled={isPending} className="w-44" />
      </div>

      {outcome === "MEETING_BOOKED" ? (
        <Textarea
          name="meetingDetails"
          placeholder="Meeting details (date, time, who)"
          rows={2}
          disabled={isPending}
        />
      ) : null}

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="whatsappConsent"
          value="true"
          disabled={isPending}
          className="h-4 w-4 rounded border-border-strong"
        />
        Consented to WhatsApp follow-up
      </label>

      <ErrorToast message={state.error} trigger={state} />

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "End call & save"}
      </button>
    </form>
  );
}
