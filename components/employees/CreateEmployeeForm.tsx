"use client";

import { useActionState } from "react";
import {
  createEmployee,
  type CreateEmployeeState,
} from "@/lib/actions/employees";

const initialState: CreateEmployeeState = { error: null };

const ROLES = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MANAGER", label: "Manager" },
  { value: "HR_MANAGER", label: "HR Manager" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
] as const;

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "INTERN", label: "Intern" },
  { value: "CONTRACT", label: "Contract" },
] as const;

export function CreateEmployeeForm({
  departments,
}: {
  departments: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createEmployee,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field id="fullName" name="fullName" label="Full name" type="text" required disabled={isPending} />
        <Field id="designation" name="designation" label="Designation" type="text" disabled={isPending} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field id="email" name="email" label="Work email" type="email" required disabled={isPending} />
        <Field
          id="password"
          name="password"
          label="Initial password"
          type="text"
          required
          disabled={isPending}
          helpText="At least 8 characters. Share this with them directly."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-foreground-muted">
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue="EMPLOYEE"
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="employmentType" className="text-sm font-medium text-foreground-muted">
            Employment type
          </label>
          <select
            id="employmentType"
            name="employmentType"
            required
            defaultValue="FULL_TIME"
            disabled={isPending}
            className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Field
          id="joiningDate"
          name="joiningDate"
          label="Joining date"
          type="date"
          required
          disabled={isPending}
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="departmentId" className="text-sm font-medium text-foreground-muted">
          Department
        </label>
        <select
          id="departmentId"
          name="departmentId"
          disabled={isPending}
          defaultValue=""
          className="h-9 w-full max-w-xs rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        >
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
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
        {isPending ? "Creating…" : "Create employee"}
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type,
  required,
  disabled,
  defaultValue,
  helpText,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  disabled: boolean;
  defaultValue?: string;
  helpText?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
      />
      {helpText ? (
        <p className="text-xs text-foreground-muted">{helpText}</p>
      ) : null}
    </div>
  );
}
