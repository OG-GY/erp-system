import { StatusBadge } from "@/components/ui/StatusBadge";
import { CreateTaskForm } from "@/components/projects/CreateTaskForm";
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
  priority: keyof typeof PRIORITY_TONE;
  dueDate: Date | null;
  assignee: { fullName: string } | null;
};

export function TasksPanel({
  projectId,
  tasks,
  members,
}: {
  projectId: string;
  tasks: Task[];
  members: { id: string; fullName: string }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">Tasks</p>

      <div className="mb-4">
        <CreateTaskForm projectId={projectId} members={members} />
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-foreground-muted">No tasks yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-foreground">{task.title}</p>
                <p className="text-xs text-foreground-muted">
                  {task.assignee?.fullName ?? "Unassigned"}
                  {task.dueDate
                    ? ` · Due ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(task.dueDate)}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <StatusBadge
                  label={PRIORITY_LABEL[task.priority]}
                  tone={PRIORITY_TONE[task.priority]}
                />
                <TaskStatusSelect taskId={task.id} status={task.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
