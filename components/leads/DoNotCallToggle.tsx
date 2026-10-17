"use client";

import { useState, useTransition } from "react";
import { setLeadDoNotCall } from "@/lib/actions/leads";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export function DoNotCallToggle({
  leadId,
  doNotCall,
  reason,
}: {
  leadId: string;
  doNotCall: boolean;
  reason: string | null;
}) {
  const { run } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reasonInput, setReasonInput] = useState("");

  function allowCalling() {
    startTransition(async () => {
      await run(() => setLeadDoNotCall(leadId, false, null));
    });
  }

  function confirmMark() {
    startTransition(async () => {
      await run(() => setLeadDoNotCall(leadId, true, reasonInput || null));
      setShowReasonInput(false);
    });
  }

  if (showReasonInput) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-danger/30 p-3">
        <p className="text-sm font-medium text-foreground">Mark do-not-call</p>
        <Input
          value={reasonInput}
          onChange={(e) => setReasonInput(e.target.value)}
          placeholder="Reason (optional)"
          disabled={isPending}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowReasonInput(false)}
            disabled={isPending}
            className="h-8 rounded-sm border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmMark}
            disabled={isPending}
            className="h-8 rounded-sm bg-danger px-3 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {doNotCall ? "Do not call" : "Calling allowed"}
        </p>
        {doNotCall && reason ? (
          <p className="truncate text-xs text-foreground-muted">{reason}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={doNotCall ? allowCalling : () => setShowReasonInput(true)}
        disabled={isPending}
        className={`h-8 shrink-0 rounded-sm px-3 text-xs font-medium transition-opacity disabled:opacity-60 ${
          doNotCall
            ? "border border-border-strong text-foreground hover:bg-overlay-hover"
            : "bg-danger text-white hover:opacity-90"
        }`}
      >
        {isPending ? "Saving…" : doNotCall ? "Allow calling again" : "Mark do-not-call"}
      </button>
    </div>
  );
}
