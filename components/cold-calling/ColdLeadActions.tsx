"use client";

import { useState, useTransition } from "react";
import { ArrowRightCircle, Trash2 } from "lucide-react";
import { convertColdLead, deleteColdLead } from "@/lib/actions/coldCalling";
import { useToast } from "@/components/ui/Toast";

export function ConvertColdLeadButton({ coldLeadId }: { coldLeadId: string }) {
  const { run } = useToast();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => void (await run(() => convertColdLead(coldLeadId))))}
      disabled={isPending}
      className="flex h-9 w-fit items-center gap-2 rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <ArrowRightCircle className="h-4 w-4" aria-hidden="true" />
      {isPending ? "Moving…" : "Move to Leads pipeline"}
    </button>
  );
}

export function DeleteColdLeadButton({ coldLeadId }: { coldLeadId: string }) {
  const { run } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex w-fit items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-danger"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        Delete business
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="text-foreground-muted">Delete it and its call history?</span>
      <button
        type="button"
        onClick={() => startTransition(async () => void (await run(() => deleteColdLead(coldLeadId))))}
        disabled={isPending}
        className="rounded-sm bg-danger px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="rounded-sm border border-border-strong px-2 py-1 text-xs font-medium text-foreground hover:bg-overlay-hover"
      >
        Cancel
      </button>
    </span>
  );
}
