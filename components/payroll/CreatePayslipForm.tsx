"use client";

import { useActionState } from "react";
import {
  createPayslip,
  type CreatePayslipState,
} from "@/lib/actions/payroll";

const initialState: CreatePayslipState = { error: null };

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
] as const;

export function CreatePayslipForm({
  employees,
}: {
  employees: { id: string; fullName: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createPayslip,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="employeeId" className="text-sm font-medium text-foreground-muted">
          Employee
        </label>
        <select
          id="employeeId"
          name="employeeId"
          required
          defaultValue=""
          className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          disabled={isPending}
        >
          <option value="" disabled>
            Select employee…
          </option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="periodStart" className="text-sm font-medium text-foreground-muted">
            Period start
          </label>
          <input
            id="periodStart"
            name="periodStart"
            type="date"
            required
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="periodEnd" className="text-sm font-medium text-foreground-muted">
            Period end
          </label>
          <input
            id="periodEnd"
            name="periodEnd"
            type="date"
            required
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="basicSalary" className="text-sm font-medium text-foreground-muted">
            Basic salary
          </label>
          <input
            id="basicSalary"
            name="basicSalary"
            type="number"
            min="0"
            step="0.01"
            required
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="allowances" className="text-sm font-medium text-foreground-muted">
            Allowances
          </label>
          <input
            id="allowances"
            name="allowances"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="deductions" className="text-sm font-medium text-foreground-muted">
            Deductions
          </label>
          <input
            id="deductions"
            name="deductions"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium text-foreground-muted">
          Status
        </label>
        <select
          id="status"
          name="status"
          required
          defaultValue="DRAFT"
          disabled={isPending}
          className="h-9 w-full max-w-xs rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create payslip"}
      </button>
    </form>
  );
}
