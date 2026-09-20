"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { Select } from "@/components/ui/Select";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      aria-label="Task status"
      className="w-36"
      onChange={(next) => {
        startTransition(async () => {
          await updateTaskStatus(taskId, next);
          router.refresh();
        });
      }}
      options={STATUS_OPTIONS}
    />
  );
}
