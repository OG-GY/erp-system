"use client";

import { useEffect, useState } from "react";
import type { ColdDuplicate } from "@/lib/actions/coldCalling";
import {
  ColdLeadForm,
  EMPTY_COLD_LEAD_DEFAULTS,
  type ColdLeadDefaults,
} from "@/components/cold-calling/ColdLeadForm";

/** "Add business" trigger that opens the create form in a modal. */
export function AddColdLeadButton({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  // Bumped on every open so the form remounts with a clean (or restored) draft.
  const [session, setSession] = useState(0);
  const [draft, setDraft] = useState<ColdLeadDefaults>(EMPTY_COLD_LEAD_DEFAULTS);
  const [duplicates, setDuplicates] = useState<ColdDuplicate[] | undefined>();

  function openFresh() {
    setDraft(EMPTY_COLD_LEAD_DEFAULTS);
    setDuplicates(undefined);
    setSession((n) => n + 1);
    setOpen(true);
  }

  // The save runs in the background after the modal closes; on a failure or a
  // duplicate number the draft comes back so nothing the user typed is lost.
  function reopenWithDraft(next: ColdLeadDefaults, found: ColdDuplicate[] | undefined) {
    setDraft(next);
    setDuplicates(found);
    setSession((n) => n + 1);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" onClick={openFresh} className={className}>
        Add business
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-cold-lead-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2 id="add-cold-lead-title" className="mb-1 text-base font-semibold text-foreground">
              Add business
            </h2>
            <p className="mb-4 text-sm text-foreground-muted">Someone you found and are about to call</p>
            <ColdLeadForm
              key={session}
              defaults={draft}
              initialDuplicates={duplicates}
              onSubmitted={() => setOpen(false)}
              onRejected={reopenWithDraft}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
