"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteLead } from "@/lib/actions/leads";
import { ErrorToast } from "@/components/ui/Toast";

export function DeleteLeadButton({ leadId, businessName }: { leadId: string; businessName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      // deleteLead's revalidatePath re-renders this route in the action's own
      // response, so no follow-up router.refresh() round-trip is needed.
      const res = await deleteLead(leadId);
      if (res.error) {
        setError(res.error);
      }
    });
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1 text-xs">
        <button
          type="button"
          onClick={confirmDelete}
          disabled={isPending}
          className="rounded-sm bg-danger px-2 py-1 font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Deleting…" : "Delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="rounded-sm border border-border-strong px-2 py-1 font-medium text-foreground hover:bg-overlay-hover"
        >
          Cancel
        </button>
        <ErrorToast message={error} />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${businessName}`}
      className="rounded-sm p-1 text-foreground-muted transition-colors hover:bg-overlay-hover hover:text-danger"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}
