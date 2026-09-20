"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteEmployee } from "@/lib/actions/employees";

export function DeleteEmployeeButton({
  employeeId,
  employeeName,
}: {
  employeeId: string;
  employeeName: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirmOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteEmployee(employeeId);
      // A successful delete redirects server-side and never returns here.
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="h-9 rounded-sm border border-danger/40 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
      >
        Delete employee
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
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
            aria-labelledby="delete-modal-title"
            className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2
              id="delete-modal-title"
              className="mb-1 text-base font-semibold text-foreground"
            >
              Delete {employeeName}?
            </h2>
            <p className="mb-4 text-sm text-foreground-muted">
              This permanently removes their account and login. Employees
              with any attendance, task, or payroll history can&apos;t be
              deleted — suspend them instead.
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
