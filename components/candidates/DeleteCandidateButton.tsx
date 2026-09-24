"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCandidate } from "@/lib/actions/candidates";

export function DeleteCandidateButton({
  candidateId,
  candidateName,
}: {
  candidateId: string;
  candidateName: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirmOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleDelete() {
    startTransition(async () => {
      await deleteCandidate(candidateId);
      // A successful delete redirects server-side and never returns here.
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label="Delete candidate"
        title="Delete candidate"
        className="flex h-9 w-9 items-center justify-center rounded-sm border border-danger/40 text-danger transition-colors hover:bg-danger/10"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setConfirmOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-candidate-modal-title"
            className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2
              id="delete-candidate-modal-title"
              className="mb-1 text-base font-semibold text-foreground"
            >
              Delete {candidateName}?
            </h2>
            <p className="mb-4 text-sm text-foreground-muted">
              This removes the candidate and all interview notes for them.
              This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="h-9 rounded-sm bg-danger px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
