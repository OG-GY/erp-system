"use client";

import { useActionState } from "react";
import {
  createPayslip,
  type CreatePayslipState,
} from "@/lib/actions/payroll";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="periodStart" className="text-sm font-medium text-foreground-muted">
            Period start
          </label>
          <Input
            id="periodStart"
            name="periodStart"
            type="date"
            required
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="periodEnd" className="text-sm font-medium text-foreground-muted">
            Period end
          </label>
          <Input
            id="periodEnd"
            name="periodEnd"
            type="date"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="basicSalary" className="text-sm font-medium text-foreground-muted">
            Basic salary (PKR)
          </label>
          <Input
            id="basicSalary"
            name="basicSalary"
            type="number"
            min="0"
            step="0.01"
            required
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="allowances" className="text-sm font-medium text-foreground-muted">
            Allowances (PKR)
          </label>
          <Input
            id="allowances"
            name="allowances"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="deductions" className="text-sm font-medium text-foreground-muted">
            Deductions (PKR)
          </label>
          <Input
            id="deductions"
            name="deductions"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium text-foreground-muted">
          Status
        </label>
        <Select
          id="status"
          name="status"
          required
          defaultValue="DRAFT"
          disabled={isPending}
          className="max-w-xs"
          options={STATUSES}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create payslip"}
      </button>
    </form>
  );
}
