"use client";

import { useEffect, useState } from "react";

export function StandupModalButton({
  standup,
  label,
}: {
  standup: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="max-w-xs truncate text-left text-foreground-muted underline decoration-border-strong decoration-dotted underline-offset-2 hover:text-foreground"
      >
        {standup}
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
            aria-labelledby="standup-modal-title"
            className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2
              id="standup-modal-title"
              className="mb-1 text-base font-semibold text-foreground"
            >
              Standup
            </h2>
            <p className="mb-4 text-sm text-foreground-muted">{label}</p>

            <p className="overflow-y-auto whitespace-pre-wrap text-sm text-foreground">
              {standup}
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
