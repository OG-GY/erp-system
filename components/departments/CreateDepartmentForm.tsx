"use client";

import { useActionState } from "react";
import {
  createDepartment,
  type CreateDepartmentState,
} from "@/lib/actions/departments";
import { Input } from "@/components/ui/Input";

const initialState: CreateDepartmentState = { error: null, success: false };

export function CreateDepartmentForm() {
  const [state, formAction, isPending] = useActionState(
    createDepartment,
    initialState,
  );

  return (
    <form
      action={formAction}
      key={state.success ? "submitted" : "form"}
      className="flex flex-col gap-2"
    >
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            htmlFor="name"
            className="text-sm font-medium text-foreground-muted"
          >
            Department name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            disabled={isPending}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
