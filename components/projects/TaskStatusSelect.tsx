"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

const STATUS_OPTIONS = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export function TaskStatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const { run } = useToast();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      aria-label="Task status"
      className="w-36"
      onChange={(next) => {
        startTransition(async () => {
          await run(() => updateTaskStatus(taskId, next));
        });
      }}
      options={STATUS_OPTIONS}
    />
  );
}
