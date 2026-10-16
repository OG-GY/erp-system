"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteLead } from "@/lib/actions/leads";

export function DeleteLeadButton({ leadId, businessName }: { leadId: string; businessName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteLead(leadId);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
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
        {error ? <span role="alert" className="text-danger">{error}</span> : null}
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
