import { CreateTaskForm } from "@/components/projects/CreateTaskForm";
import { TaskBoard } from "@/components/projects/TaskBoard";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | null;
  assigneeId: string | null;
  assignee: { fullName: string } | null;
};

export function TasksPanel({
  projectId,
  tasks,
  members,
  viewerId,
  canManage,
}: {
  projectId: string;
  tasks: Task[];
  members: { id: string; fullName: string }[];
  viewerId: string;
  canManage: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">Tasks</p>

      {canManage ? (
        <div className="mb-4">
          <CreateTaskForm projectId={projectId} members={members} />
        </div>
      ) : null}

      <TaskBoard
        tasks={tasks.map((t) => ({ ...t, projectId }))}
        viewerId={viewerId}
        managedProjectIds={canManage ? [projectId] : []}
      />
    </div>
  );
}
