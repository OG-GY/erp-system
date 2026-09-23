"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Check, X } from "lucide-react";
import { updateTaskStatus } from "@/lib/actions/tasks";

export function TaskQuickActions({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setStatus(next: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, next);
      router.refresh();
    });
  }

  const isInProgress = status === "IN_PROGRESS";

  return (
    <div className="flex shrink-0 items-center gap-1">
      {isInProgress ? (
        <button
          type="button"
          onClick={() => setStatus("COMPLETED")}
          disabled={isPending}
          aria-label="Mark task complete"
          title="Complete"
          className="rounded-sm p-1 text-success transition-colors hover:bg-success/12 disabled:opacity-60"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setStatus("IN_PROGRESS")}
          disabled={isPending}
          aria-label="Start task"
          title="Start"
          className="rounded-sm p-1 text-accent transition-colors hover:bg-accent/12 disabled:opacity-60"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        onClick={() => setStatus("CANCELLED")}
        disabled={isPending}
        aria-label="Cancel task"
        title="Cancel"
        className="rounded-sm p-1 text-danger transition-colors hover:bg-danger/12 disabled:opacity-60"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
