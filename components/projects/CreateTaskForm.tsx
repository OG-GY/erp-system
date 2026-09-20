"use client";

import { useActionState } from "react";
import { createTask, type CreateTaskState } from "@/lib/actions/projects";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const initialState: CreateTaskState = { error: null };

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export function CreateTaskForm({
  projectId,
  members,
}: {
  projectId: string;
  members: { id: string; fullName: string }[];
}) {
  const boundAction = createTask.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-[10rem] flex-1 flex-col gap-1.5">
        <label htmlFor="title" className="text-xs font-medium text-foreground-muted">
          Task title
        </label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="assigneeId" className="text-xs font-medium text-foreground-muted">
          Assignee
        </label>
        <Select
          id="assigneeId"
          name="assigneeId"
          disabled={isPending}
          defaultValue=""
          placeholder="Unassigned"
          options={[
            { value: "", label: "Unassigned" },
            ...members.map((m) => ({ value: m.id, label: m.fullName })),
          ]}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="priority" className="text-xs font-medium text-foreground-muted">
          Priority
        </label>
        <Select
          id="priority"
          name="priority"
          disabled={isPending}
          defaultValue="MEDIUM"
          options={PRIORITIES}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dueDate" className="text-xs font-medium text-foreground-muted">
          Due date
        </label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          disabled={isPending}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-9 rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add task"}
      </button>

      {state.error ? (
        <p role="alert" className="w-full text-sm text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
