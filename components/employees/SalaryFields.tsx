"use client";

import { useState } from "react";

const SALARY_TYPES = [
  { value: "", label: "Not set yet" },
  { value: "FIXED", label: "Fixed / base salary" },
  { value: "COMMISSION", label: "Commission per project" },
] as const;

/**
 * Just the salary type + conditional amount fields — no <form> wrapper, no
 * submit button. Shared by the "Add employee" form and the admin employee
 * detail page's salary editor, so the two don't drift out of sync.
 */
export function SalaryFields({
  defaultSalaryType,
  defaultBaseSalary,
  defaultCommissionPerProject,
  disabled,
}: {
  defaultSalaryType?: "FIXED" | "COMMISSION" | "";
  defaultBaseSalary?: number | null;
  defaultCommissionPerProject?: number | null;
  disabled?: boolean;
}) {
  const [salaryType, setSalaryType] = useState<string>(
    defaultSalaryType ?? "",
  );

  return (
    <div className="flex flex-col gap-4">
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
          onChange={(e) => setSalaryType(e.target.value)}
          disabled={disabled}
          className="h-9 w-full max-w-xs rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        >
          {SALARY_TYPES.map((t) => (
            <option key={t.value || "unset"} value={t.value}>
              {t.label}
            </option>
          ))}
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
            defaultValue={defaultBaseSalary ?? ""}
            disabled={disabled}
            className="h-9 w-full max-w-xs rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
      ) : null}

      {salaryType === "COMMISSION" ? (
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
            defaultValue={defaultCommissionPerProject ?? ""}
            disabled={disabled}
            className="h-9 w-full max-w-xs rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          />
        </div>
      ) : null}
    </div>
  );
}
