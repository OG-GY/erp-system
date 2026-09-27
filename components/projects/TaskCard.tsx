"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";

const PRIORITY_TONE = {
  LOW: "neutral",
  MEDIUM: "neutral",
  HIGH: "warning",
  URGENT: "danger",
} as const;

const PRIORITY_LABEL = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
} as const;

type Task = {
  id: string;
  title: string;
  priority: keyof typeof PRIORITY_LABEL;
  dueDate: Date | null;
  assignee: { fullName: string } | null;
  project?: { id: string; name: string };
};

export function TaskCard({
  task,
  canDrag,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  task: Task;
  canDrag: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      onDragEnd={canDrag ? onDragEnd : undefined}
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-md border border-border bg-surface p-3 text-left text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md ${
        canDrag ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <span className="font-medium text-foreground">{task.title}</span>
      {task.project ? (
        <span className="truncate text-xs text-accent">{task.project.name}</span>
      ) : null}
      <span className="text-xs text-foreground-muted">
        {task.assignee?.fullName ?? "Unassigned"}
      </span>
      <div className="mt-1 flex items-center justify-between text-xs text-foreground-muted">
        <span>
          {task.dueDate
            ? new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeZone: "UTC",
              }).format(task.dueDate)
            : "No due date"}
        </span>
        <StatusBadge
          label={PRIORITY_LABEL[task.priority]}
          tone={PRIORITY_TONE[task.priority]}
        />
      </div>
    </button>
  );
}
