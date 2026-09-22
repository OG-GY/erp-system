"use client";

import { useActionState, useEffect, useRef } from "react";
import { checkIn, type AttendanceActionState } from "@/lib/actions/attendance";
import { Input } from "@/components/ui/Input";

const initialState: AttendanceActionState = { error: null, success: false };

function dateToDateString(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function nowTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

/**
 * Combines a picked "YYYY-MM-DD" date and "HH:MM" time into a real Date —
 * resolved in the browser's own timezone (the employee's), not the
 * server's. Sent as a full ISO timestamp rather than bare digits, so the
 * server never has to guess what timezone/day they were meant in.
 */
function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function CheckInModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(checkIn, initialState);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const isoInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const todayStr = dateToDateString(today);
  const yesterdayStr = dateToDateString(yesterday);

  useEffect(() => {
    timeInputRef.current?.focus();
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

  function handleSubmit() {
    if (dateInputRef.current?.value && timeInputRef.current?.value && isoInputRef.current) {
      isoInputRef.current.value = combineDateAndTime(
        dateInputRef.current.value,
        timeInputRef.current.value,
      ).toISOString();
    }
  }

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
          Defaults to now — change the date or time if you forgot to check
          in earlier (today or yesterday only).
        </p>

        <form
          action={formAction}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="date"
                className="text-sm font-medium text-foreground-muted"
              >
                Date
              </label>
              <Input
                ref={dateInputRef}
                id="date"
                name="checkInDate"
                type="date"
                required
                defaultValue={todayStr}
                min={yesterdayStr}
                max={todayStr}
                disabled={isPending}
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="time"
                className="text-sm font-medium text-foreground-muted"
              >
                Time
              </label>
              <Input
                ref={timeInputRef}
                id="time"
                type="time"
                required
                defaultValue={nowTimeString()}
                disabled={isPending}
                className="h-10"
              />
            </div>
            <input ref={isoInputRef} type="hidden" name="checkInIso" />
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
              {isPending ? "Checking in…" : "Check in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
