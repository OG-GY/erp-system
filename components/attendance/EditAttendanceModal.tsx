"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  updateAttendanceRecord,
  type UpdateAttendanceRecordState,
} from "@/lib/actions/attendanceAdmin";
import { Input } from "@/components/ui/Input";

const initialState: UpdateAttendanceRecordState = { error: null, success: false };

function toDatetimeLocalValue(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * A datetime-local input's value ("2026-09-22T18:15") carries no timezone —
 * parsing it server-side would resolve it in the server's own runtime
 * timezone (UTC on Vercel), not the admin's. Parsing it here instead, with
 * the browser's local Date constructor, resolves it in the admin's actual
 * timezone before sending an unambiguous ISO string.
 */
function datetimeLocalToDate(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Computes checkInIso/checkOutIso from the datetime-local field values here,
 * in the action itself, before handing off to the updateAttendanceRecord
 * Server Action — see checkInWithComputedIso in CheckInModal for the same
 * pattern and why (a hidden input written from onSubmit isn't guaranteed to
 * land before React's action-form machinery captures FormData).
 */
async function updateAttendanceWithComputedIso(
  recordId: string,
  prevState: UpdateAttendanceRecordState,
  formData: FormData,
): Promise<UpdateAttendanceRecordState> {
  const checkInDate = datetimeLocalToDate(String(formData.get("checkIn") ?? ""));
  const checkOutDate = datetimeLocalToDate(String(formData.get("checkOut") ?? ""));

  if (checkInDate) {
    formData.set("checkInIso", checkInDate.toISOString());
  }
  if (checkOutDate) {
    formData.set("checkOutIso", checkOutDate.toISOString());
  } else {
    formData.delete("checkOutIso");
  }

  return updateAttendanceRecord(recordId, prevState, formData);
}

export function EditAttendanceModal({
  recordId,
  employeeName,
  checkIn,
  checkOut,
  onClose,
}: {
  recordId: string;
  employeeName: string;
  checkIn: Date | null;
  checkOut: Date | null;
  onClose: () => void;
}) {
  const boundAction = updateAttendanceWithComputedIso.bind(null, recordId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state.success) onClose();
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
        aria-labelledby="edit-attendance-modal-title"
        className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <h2
          id="edit-attendance-modal-title"
          className="mb-1 text-base font-semibold text-foreground"
        >
          Edit attendance
        </h2>
        <p className="mb-4 text-sm text-foreground-muted">{employeeName}</p>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="checkIn"
              className="text-sm font-medium text-foreground-muted"
            >
              Check-in
            </label>
            <Input
              ref={inputRef}
              id="checkIn"
              name="checkIn"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocalValue(checkIn)}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="checkOut"
              className="text-sm font-medium text-foreground-muted"
            >
              Check-out
            </label>
            <Input
              id="checkOut"
              name="checkOut"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(checkOut)}
              disabled={isPending}
            />
            <p className="text-xs text-foreground-muted">
              Leave blank to mark them as still checked in.
            </p>
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
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
