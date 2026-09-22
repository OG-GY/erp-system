"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteAttendanceRecord } from "@/lib/actions/attendanceAdmin";
import { EditAttendanceModal } from "@/components/attendance/EditAttendanceModal";

export function AttendanceRowActions({
  recordId,
  employeeName,
  checkIn,
  checkOut,
}: {
  recordId: string;
  employeeName: string;
  checkIn: Date | null;
  checkOut: Date | null;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAttendanceRecord(recordId);
      if (result.error) {
        setError(result.error);
      } else {
        setConfirmOpen(false);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        aria-label={`Edit ${employeeName}'s attendance`}
        title="Edit"
        className="rounded-sm p-1 text-accent transition-colors hover:bg-accent/12"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label={`Delete ${employeeName}'s attendance record`}
        title="Delete"
        className="rounded-sm p-1 text-danger transition-colors hover:bg-danger/12"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>

      {editOpen ? (
        <EditAttendanceModal
          recordId={recordId}
          employeeName={employeeName}
          checkIn={checkIn}
          checkOut={checkOut}
          onClose={() => setEditOpen(false)}
        />
      ) : null}

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
            aria-labelledby="delete-attendance-modal-title"
            className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2
              id="delete-attendance-modal-title"
              className="mb-1 text-base font-semibold text-foreground"
            >
              Delete this attendance record?
            </h2>
            <p className="mb-4 text-sm text-foreground-muted">
              {employeeName} — this permanently removes the check-in,
              check-out, and any breaks for this day.
            </p>
            {error ? (
              <p role="alert" className="mb-4 text-sm text-danger">
                {error}
              </p>
            ) : null}
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
