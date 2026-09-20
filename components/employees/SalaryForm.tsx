"use client";

import { useActionState } from "react";
import {
  updateEmployeeSalary,
  type UpdateSalaryState,
} from "@/lib/actions/employees";
import { SalaryFields } from "@/components/employees/SalaryFields";

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

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <SalaryFields
        defaultSalaryType={currentSalaryType ?? ""}
        defaultBaseSalary={currentBaseSalary}
        defaultCommissionPerProject={currentCommissionPerProject}
        disabled={isPending}
      />

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
