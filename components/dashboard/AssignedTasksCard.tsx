import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

const STATUS_TONE = {
  TODO: "neutral",
  IN_PROGRESS: "warning",
  IN_REVIEW: "warning",
  BLOCKED: "danger",
  COMPLETED: "success",
  CANCELLED: "neutral",
} as const;

const STATUS_LABEL = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

type Task = {
  id: string;
  title: string;
  status: keyof typeof STATUS_LABEL;
  dueDate: Date | null;
  project: { id: string; name: string };
};

export function AssignedTasksCard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">Assigned tasks</p>

      {tasks.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          You have no open tasks assigned.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={`/projects/${task.project.id}`}
                className="flex items-center justify-between gap-2 rounded-sm px-1 py-1 text-sm hover:bg-overlay-hover"
              >
                <span className="min-w-0">
                  <span className="block truncate text-foreground">{task.title}</span>
                  <span className="block truncate text-xs text-foreground-muted">
                    {task.project.name}
                    {task.dueDate
                      ? ` · Due ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(task.dueDate)}`
                      : ""}
                  </span>
                </span>
                <StatusBadge
                  label={STATUS_LABEL[task.status]}
                  tone={STATUS_TONE[task.status]}
                  className="shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
