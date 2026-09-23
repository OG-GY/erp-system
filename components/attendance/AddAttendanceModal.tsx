"use client";

import { useActionState, useEffect } from "react";
import {
  createAttendanceRecord,
  type CreateAttendanceRecordState,
} from "@/lib/actions/attendanceAdmin";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const initialState: CreateAttendanceRecordState = { error: null, success: false };

/**
 * A datetime-local input's value carries no timezone — parsing it here with
 * the browser's local Date constructor resolves it in the admin's actual
 * timezone before sending an unambiguous ISO string. Same pattern as
 * EditAttendanceModal's datetimeLocalToDate.
 */
function datetimeLocalToDate(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

async function createAttendanceWithComputedIso(
  prevState: CreateAttendanceRecordState,
  formData: FormData,
): Promise<CreateAttendanceRecordState> {
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

  return createAttendanceRecord(prevState, formData);
}

export function AddAttendanceModal({
  employees,
  todayValue,
  onClose,
}: {
  employees: { id: string; fullName: string }[];
  todayValue: string;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    createAttendanceWithComputedIso,
    initialState,
  );

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
        aria-labelledby="add-attendance-modal-title"
        className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <h2
          id="add-attendance-modal-title"
          className="mb-1 text-base font-semibold text-foreground"
        >
          Add attendance record
        </h2>
        <p className="mb-4 text-sm text-foreground-muted">
          For an employee who forgot to check in.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="employeeId" className="text-sm font-medium text-foreground-muted">
              Employee
            </label>
            <Select
              id="employeeId"
              name="employeeId"
              required
              defaultValue=""
              placeholder="Select employee…"
              disabled={isPending}
              options={employees.map((e) => ({ value: e.id, label: e.fullName }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-sm font-medium text-foreground-muted">
              Date
            </label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={todayValue}
              max={todayValue}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="addCheckIn" className="text-sm font-medium text-foreground-muted">
              Check-in
            </label>
            <Input
              id="addCheckIn"
              name="checkIn"
              type="datetime-local"
              required
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="addCheckOut" className="text-sm font-medium text-foreground-muted">
              Check-out
            </label>
            <Input id="addCheckOut" name="checkOut" type="datetime-local" disabled={isPending} />
            <p className="text-xs text-foreground-muted">
              Leave blank to mark them as still checked in.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="addStandup" className="text-sm font-medium text-foreground-muted">
              Standup
            </label>
            <Textarea
              id="addStandup"
              name="standup"
              rows={3}
              disabled={isPending}
              placeholder="What they worked on (optional)"
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
              {isPending ? "Adding…" : "Add record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
