"use client";

import { useActionState, useState } from "react";
import {
  updateEmployeeSalary,
  type UpdateSalaryState,
} from "@/lib/actions/employees";

const initialState: UpdateSalaryState = { error: null, success: false };

export function SalaryForm({
  employeeId,
  currentSalaryType,
  currentBaseSalary,
  currentCommissionPerProject,
}: {
  employeeId: string;
  currentSalaryType: "FIXED" | "COMMISSION" | null;
  currentBaseSalary: number | null;
  currentCommissionPerProject: number | null;
}) {
  const boundAction = updateEmployeeSalary.bind(null, employeeId);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );
  const [salaryType, setSalaryType] = useState<"FIXED" | "COMMISSION">(
    currentSalaryType ?? "FIXED",
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="salaryType"
          className="text-sm font-medium text-foreground-muted"
        >
          Salary type
        </label>
        <select
          id="salaryType"
          name="salaryType"
          value={salaryType}
          onChange={(e) =>
            setSalaryType(e.target.value as "FIXED" | "COMMISSION")
          }
          disabled={isPending}
          className="h-9 w-full max-w-xs rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        >
          <option value="FIXED">Fixed / base salary</option>
          <option value="COMMISSION">Commission per project</option>
        </select>
      </div>

      {salaryType === "FIXED" ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="baseSalary"
            className="text-sm font-medium text-foreground-muted"
          >
            Base salary
          </label>
          <input
            id="baseSalary"
            name="baseSalary"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={currentBaseSalary ?? ""}
            disabled={isPending}
            className="h-9 w-full max-w-xs rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="commissionPerProject"
            className="text-sm font-medium text-foreground-muted"
          >
            Commission per project
          </label>
          <input
            id="commissionPerProject"
            name="commissionPerProject"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={currentCommissionPerProject ?? ""}
            disabled={isPending}
            className="h-9 w-full max-w-xs rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
      )}

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-success">
          Salary saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save salary"}
      </button>
    </form>
  );
}
