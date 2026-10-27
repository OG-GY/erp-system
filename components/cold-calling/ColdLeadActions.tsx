"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightCircle, Trash2 } from "lucide-react";
import { convertColdLead, deleteColdLead } from "@/lib/actions/coldCalling";
import { useToast } from "@/components/ui/Toast";

export function ConvertColdLeadButton({ coldLeadId }: { coldLeadId: string }) {
  const { track } = useToast();
  const [isMoving, setIsMoving] = useState(false);

  async function handleClick() {
    setIsMoving(true);
    await track({ pending: "Moving to Leads…", done: "Moved to Leads" }, () => convertColdLead(coldLeadId));
    setIsMoving(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isMoving}
      className="flex h-9 w-fit items-center gap-2 rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <ArrowRightCircle className="h-4 w-4" aria-hidden="true" />
      Move to Leads pipeline
    </button>
  );
}

export function DeleteColdLeadButton({ coldLeadId }: { coldLeadId: string }) {
  const { track } = useToast();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  // Leave the page straight away; the delete finishes in the background.
  function handleDelete() {
    router.push("/cold-calling");
    void track({ pending: "Deleting business…", done: "Business deleted" }, () => deleteColdLead(coldLeadId));
  }

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
        onClick={handleDelete}
        className="rounded-sm bg-danger px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-sm border border-border-strong px-2 py-1 text-xs font-medium text-foreground hover:bg-overlay-hover"
      >
        Cancel
      </button>
    </span>
  );
}
