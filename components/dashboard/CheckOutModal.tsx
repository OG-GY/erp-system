"use client";

import { useActionState, useEffect, useRef } from "react";
import { checkOut, type AttendanceActionState } from "@/lib/actions/attendance";

const initialState: AttendanceActionState = { error: null, success: false };

export function CheckOutModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(checkOut, initialState);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <h2
          id="checkout-modal-title"
          className="mb-1 text-base font-semibold text-foreground"
        >
          Check out
        </h2>
        <p className="mb-4 text-sm text-foreground-muted">
          What did you work on today? This also closes any open break.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="standup"
              className="text-sm font-medium text-foreground-muted"
            >
              Standup
            </label>
            <textarea
              ref={textareaRef}
              id="standup"
              name="standup"
              rows={4}
              required
              disabled={isPending}
              placeholder="Worked on…"
              className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Checking out…" : "Check out"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
