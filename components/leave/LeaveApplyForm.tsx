"use client";

import { useActionState } from "react";
import { applyForLeave, type LeaveActionState } from "@/lib/actions/leave";

const initialState: LeaveActionState = { error: null, success: false };

const LEAVE_TYPES = [
  { value: "CASUAL", label: "Casual" },
  { value: "SICK", label: "Sick" },
  { value: "ANNUAL", label: "Annual" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "EMERGENCY", label: "Emergency" },
] as const;

export function LeaveApplyForm() {
  const [state, formAction, isPending] = useActionState(
    applyForLeave,
    initialState,
  );

  return (
    <form
      action={formAction}
      key={state.success ? "submitted" : "form"}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="leaveType" className="text-sm font-medium text-foreground-muted">
            Leave type
          </label>
          <select
            id="leaveType"
            name="leaveType"
            required
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium text-foreground-muted">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="endDate" className="text-sm font-medium text-foreground-muted">
            End date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="text-sm font-medium text-foreground-muted">
          Reason
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={2}
          required
          disabled={isPending}
          className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-success">
          Leave request submitted.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Apply for leave"}
      </button>
    </form>
  );
}
