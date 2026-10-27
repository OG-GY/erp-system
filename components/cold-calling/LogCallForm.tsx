"use client";

import { useState, type FormEvent } from "react";
import type { ColdLeadStatus } from "@prisma/client";
import { logColdCall, type LogColdCallState } from "@/lib/actions/coldCalling";
import {
  CALL_OUTCOMES,
  CLOSED_COLD_STATUSES,
  COLD_STATUS_LABEL,
  OUTCOMES_REQUIRING_FOLLOW_UP,
  toPktInputValue,
} from "@/lib/coldCalling";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";

const DAY_MS = 86_400_000;

// Day-based picks land at 11am PKT — a sensible time to call a business.
function inDaysAt11(days: number) {
  return `${toPktInputValue(new Date(Date.now() + days * DAY_MS)).slice(0, 10)}T11:00`;
}

const QUICK_PICKS = [
  { label: "In 2 hours", value: () => toPktInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000)) },
  { label: "Tomorrow", value: () => inDaysAt11(1) },
  { label: "3 days", value: () => inDaysAt11(3) },
  { label: "1 week", value: () => inDaysAt11(7) },
  { label: "1 month", value: () => inDaysAt11(30) },
  { label: "3 months", value: () => inDaysAt11(90) },
];

export function LogCallForm({
  coldLeadId,
  currentStatus,
}: {
  coldLeadId: string;
  currentStatus: ColdLeadStatus;
}) {
  const [outcome, setOutcome] = useState<ColdLeadStatus | "">("");
  const [followUpAt, setFollowUpAt] = useState("");
  const { track } = useToast();

  // Reset right away and save in the background; if it fails, restore what was entered.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const saved = { outcome, followUpAt, notes: String(formData.get("notes") ?? "") };

    setOutcome("");
    setFollowUpAt("");
    form.reset();
    const result = await track<LogColdCallState>({ pending: "Logging call…", done: "Call logged" }, () =>
      logColdCall(coldLeadId, { error: null, success: false }, formData),
    );

    if (!result || result.error) {
      setOutcome(saved.outcome);
      setFollowUpAt(saved.followUpAt);
      const notesField = form.elements.namedItem("notes");
      if (notesField instanceof HTMLTextAreaElement) notesField.value = saved.notes;
    }
  }

  const outcomes: ColdLeadStatus[] =
    currentStatus === "SEND_DETAILS" ? ["DETAILS_SENT", ...CALL_OUTCOMES] : [...CALL_OUTCOMES];
  const showFollowUp = outcome !== "" && !CLOSED_COLD_STATUSES.includes(outcome);
  const followUpRequired = outcome !== "" && OUTCOMES_REQUIRING_FOLLOW_UP.includes(outcome);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground-muted">What happened?</legend>
        <div className="flex flex-wrap gap-2">
          {outcomes.map((value) => (
            <label
              key={value}
              className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/30 ${
                outcome === value
                  ? "border-accent bg-accent/12 font-medium text-accent"
                  : "border-border-strong text-foreground hover:bg-overlay-hover"
              }`}
            >
              <input
                type="radio"
                name="outcome"
                value={value}
                checked={outcome === value}
                onChange={() => setOutcome(value)}
                required
                className="sr-only"
              />
              {value === "DETAILS_SENT" ? "Sent the details" : COLD_STATUS_LABEL[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`notes-${coldLeadId}`} className="text-sm font-medium text-foreground-muted">
          What did they say?
        </label>
        <Textarea id={`notes-${coldLeadId}`} name="notes" rows={2} />
      </div>

      {showFollowUp ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`followUpAt-${coldLeadId}`} className="text-sm font-medium text-foreground-muted">
            {outcome === "CALLBACK" ? "Call back on" : "Follow up on"}
            {followUpRequired ? "" : " (optional)"}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id={`followUpAt-${coldLeadId}`}
              name="followUpAt"
              type="datetime-local"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
              required={followUpRequired}
             
            />
            {QUICK_PICKS.map((pick) => (
              <button
                key={pick.label}
                type="button"
                onClick={() => setFollowUpAt(pick.value())}
               
                className="h-7 rounded-sm border border-border px-2 text-xs text-foreground-muted transition-colors hover:bg-overlay-hover hover:text-foreground"
              >
                {pick.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={outcome === ""}
          className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Save
        </button>
      </div>
    </form>
  );
}
