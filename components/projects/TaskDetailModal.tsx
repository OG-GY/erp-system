"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TaskStatusSelect } from "@/components/projects/TaskStatusSelect";

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
  status: string;
  priority: keyof typeof PRIORITY_LABEL;
  dueDate: Date | null;
  assignee: { fullName: string } | null;
  project?: { id: string; name: string };
};

export function TaskDetailModal({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 id="task-modal-title" className="text-base font-semibold text-foreground">
            {task.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 text-foreground-muted hover:bg-overlay-hover hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {task.project ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Project</span>
              <span className="text-foreground">{task.project.name}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-muted">Assignee</span>
            <span className="text-foreground">{task.assignee?.fullName ?? "Unassigned"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-muted">Priority</span>
            <StatusBadge
              label={PRIORITY_LABEL[task.priority]}
              tone={PRIORITY_TONE[task.priority]}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-muted">Due date</span>
            <span className="text-foreground">
              {task.dueDate
                ? new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  }).format(task.dueDate)
                : "No due date"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-foreground-muted">Status</p>
            <TaskStatusSelect taskId={task.id} status={task.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
