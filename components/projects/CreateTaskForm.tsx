"use client";

import { useActionState } from "react";
import { createTask, type CreateTaskState } from "@/lib/actions/projects";

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
        <input
          id="title"
          name="title"
          type="text"
          required
          disabled={isPending}
          className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="assigneeId" className="text-xs font-medium text-foreground-muted">
          Assignee
        </label>
        <select
          id="assigneeId"
          name="assigneeId"
          disabled={isPending}
          defaultValue=""
          className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="priority" className="text-xs font-medium text-foreground-muted">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          disabled={isPending}
          defaultValue="MEDIUM"
          className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dueDate" className="text-xs font-medium text-foreground-muted">
          Due date
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          disabled={isPending}
          className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-9 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
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
