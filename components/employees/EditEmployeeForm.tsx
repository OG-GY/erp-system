"use client";

import { useActionState } from "react";
import {
  updateEmployeeDetails,
  type UpdateEmployeeState,
} from "@/lib/actions/employees";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const initialState: UpdateEmployeeState = { error: null, success: false };

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

const EMPLOYMENT_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive (suspended)" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "TERMINATED", label: "Terminated" },
] as const;

export function EditEmployeeForm({
  employeeId,
  departments,
  defaultFullName,
  defaultDesignation,
  defaultRole,
  defaultEmploymentType,
  defaultEmploymentStatus,
  defaultJoiningDate,
  defaultDepartmentId,
  defaultIdCardNumber,
}: {
  employeeId: string;
  departments: { id: string; name: string }[];
  defaultFullName: string;
  defaultDesignation: string;
  defaultRole: (typeof ROLES)[number]["value"];
  defaultEmploymentType: (typeof EMPLOYMENT_TYPES)[number]["value"];
  defaultEmploymentStatus: (typeof EMPLOYMENT_STATUSES)[number]["value"];
  defaultJoiningDate: string;
  defaultDepartmentId: string;
  defaultIdCardNumber: string;
}) {
  const boundAction = updateEmployeeDetails.bind(null, employeeId);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="fullName"
          name="fullName"
          label="Full name"
          type="text"
          required
          disabled={isPending}
          defaultValue={defaultFullName}
        />
        <Field
          id="designation"
          name="designation"
          label="Designation"
          type="text"
          disabled={isPending}
          defaultValue={defaultDesignation}
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
            defaultValue={defaultRole}
            disabled={isPending}
            options={ROLES}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="employmentType"
            className="text-sm font-medium text-foreground-muted"
          >
            Employment type
          </label>
          <Select
            id="employmentType"
            name="employmentType"
            required
            defaultValue={defaultEmploymentType}
            disabled={isPending}
            options={EMPLOYMENT_TYPES}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="employmentStatus"
            className="text-sm font-medium text-foreground-muted"
          >
            Status
          </label>
          <Select
            id="employmentStatus"
            name="employmentStatus"
            required
            defaultValue={defaultEmploymentStatus}
            disabled={isPending}
            options={EMPLOYMENT_STATUSES}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="joiningDate"
          name="joiningDate"
          label="Joining date"
          type="date"
          required
          disabled={isPending}
          defaultValue={defaultJoiningDate}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="departmentId"
            className="text-sm font-medium text-foreground-muted"
          >
            Department
          </label>
          <Select
            id="departmentId"
            name="departmentId"
            disabled={isPending}
            defaultValue={defaultDepartmentId}
            placeholder="No department"
            options={[
              { value: "", label: "No department" },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>
      </div>

      <Field
        id="idCardNumber"
        name="idCardNumber"
        label="ID card number"
        type="text"
        disabled={isPending}
        defaultValue={defaultIdCardNumber}
      />

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-success">
          Details saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save details"}
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
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  disabled: boolean;
  defaultValue?: string;
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
    </div>
  );
}
