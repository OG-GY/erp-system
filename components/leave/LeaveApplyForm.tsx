"use client";

import { useActionState } from "react";
import { applyForLeave, type LeaveActionState } from "@/lib/actions/leave";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

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
          <Select
            id="leaveType"
            name="leaveType"
            required
            disabled={isPending}
            defaultValue="CASUAL"
            options={LEAVE_TYPES}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium text-foreground-muted">
            Start date
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="endDate" className="text-sm font-medium text-foreground-muted">
            End date
          </label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="text-sm font-medium text-foreground-muted">
          Reason
        </label>
        <Textarea
          id="reason"
          name="reason"
          rows={2}
          required
          disabled={isPending}
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
        className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Apply for leave"}
      </button>
    </form>
  );
}
