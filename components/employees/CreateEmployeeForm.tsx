"use client";

import { useActionState } from "react";
import {
  createEmployee,
  type CreateEmployeeState,
} from "@/lib/actions/employees";
import { SalaryFields } from "@/components/employees/SalaryFields";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="fullName" name="fullName" label="Full name" type="text" required disabled={isPending} />
        <Field id="designation" name="designation" label="Designation" type="text" disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-foreground-muted">
            Role
          </label>
          <Select
            id="role"
            name="role"
            required
            defaultValue="EMPLOYEE"
            disabled={isPending}
            options={ROLES}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="employmentType" className="text-sm font-medium text-foreground-muted">
            Employment type
          </label>
          <Select
            id="employmentType"
            name="employmentType"
            required
            defaultValue="FULL_TIME"
            disabled={isPending}
            options={EMPLOYMENT_TYPES}
          />
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
        <Select
          id="departmentId"
          name="departmentId"
          disabled={isPending}
          defaultValue=""
          placeholder="No department"
          className="max-w-xs"
          options={[
            { value: "", label: "No department" },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
      </div>

      <SalaryFields disabled={isPending} />

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
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
      />
      {helpText ? (
        <p className="text-xs text-foreground-muted">{helpText}</p>
      ) : null}
    </div>
  );
}
