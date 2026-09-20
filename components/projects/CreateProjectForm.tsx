"use client";

import { useActionState } from "react";
import {
  createProject,
  type CreateProjectState,
} from "@/lib/actions/projects";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

const initialState: CreateProjectState = { error: null };

const STATUSES = [
  { value: "PLANNING", label: "Planning" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export function CreateProjectForm() {
  const [state, formAction, isPending] = useActionState(
    createProject,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground-muted">
          Project name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-foreground-muted">
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium text-foreground-muted">
            Status
          </label>
          <Select
            id="status"
            name="status"
            required
            defaultValue="PLANNING"
            disabled={isPending}
            options={STATUSES}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium text-foreground-muted">
            Start date
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="endDate" className="text-sm font-medium text-foreground-muted">
            End date
          </label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            disabled={isPending}
          />
        </div>
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
        {isPending ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}
