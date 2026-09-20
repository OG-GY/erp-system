"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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
        <Select
          id="salaryType"
          name="salaryType"
          value={salaryType}
          onChange={setSalaryType}
          disabled={disabled}
          className="max-w-xs"
          options={SALARY_TYPES}
        />
      </div>

      {salaryType === "FIXED" ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="baseSalary"
            className="text-sm font-medium text-foreground-muted"
          >
            Base salary (PKR)
          </label>
          <Input
            id="baseSalary"
            name="baseSalary"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultBaseSalary ?? ""}
            disabled={disabled}
            className="max-w-xs"
          />
        </div>
      ) : null}

      {salaryType === "COMMISSION" ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="commissionPerProject"
            className="text-sm font-medium text-foreground-muted"
          >
            Commission per project (PKR)
          </label>
          <Input
            id="commissionPerProject"
            name="commissionPerProject"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultCommissionPerProject ?? ""}
            disabled={disabled}
            className="max-w-xs"
          />
        </div>
      ) : null}
    </div>
  );
}
