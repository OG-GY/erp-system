"use client";

import { useActionState, useEffect, useRef } from "react";
import { checkIn, type AttendanceActionState } from "@/lib/actions/attendance";

const initialState: AttendanceActionState = { error: null, success: false };

function nowTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

export function CheckInModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(checkIn, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
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
        aria-labelledby="checkin-modal-title"
        className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <h2
          id="checkin-modal-title"
          className="mb-1 text-base font-semibold text-foreground"
        >
          Check in
        </h2>
        <p className="mb-4 text-sm text-foreground-muted">
          Defaults to now — change it if you forgot to check in earlier.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="time"
              className="text-sm font-medium text-foreground-muted"
            >
              Time
            </label>
            <input
              ref={inputRef}
              id="time"
              name="time"
              type="time"
              required
              defaultValue={nowTimeString()}
              disabled={isPending}
              className="h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
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
              className="h-9 rounded-full border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Checking in…" : "Check in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
