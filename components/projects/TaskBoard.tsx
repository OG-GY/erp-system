"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { TaskCard } from "@/components/projects/TaskCard";
import { TaskDetailModal } from "@/components/projects/TaskDetailModal";

const COLUMNS = [
  { status: "TODO", label: "To do" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "IN_REVIEW", label: "In review" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "COMPLETED", label: "Completed" },
  { status: "CANCELLED", label: "Cancelled" },
] as const;

// Literal, fully-written class names (not interpolated) so Tailwind's
// scanner picks them up — same reasoning as InterviewBoard's COLUMN_STYLES.
const COLUMN_STYLES: Record<(typeof COLUMNS)[number]["status"], { bar: string; dot: string; wash: string }> = {
  TODO: { bar: "border-t-info", dot: "bg-info", wash: "bg-info/5" },
  IN_PROGRESS: { bar: "border-t-accent", dot: "bg-accent", wash: "bg-accent/5" },
  IN_REVIEW: { bar: "border-t-warning", dot: "bg-warning", wash: "bg-warning/5" },
  BLOCKED: { bar: "border-t-danger", dot: "bg-danger", wash: "bg-danger/5" },
  COMPLETED: { bar: "border-t-success", dot: "bg-success", wash: "bg-success/5" },
  CANCELLED: { bar: "border-t-accent-secondary", dot: "bg-accent-secondary", wash: "bg-accent-secondary/5" },
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | null;
  assigneeId: string | null;
  projectId: string;
  assignee: { fullName: string } | null;
  project?: { id: string; name: string };
};

export function TaskBoard({
  tasks: initialTasks,
  viewerId,
  viewerIsAdmin = false,
  managedProjectIds = [],
}: {
  tasks: Task[];
  viewerId: string;
  viewerIsAdmin?: boolean;
  /** Project ids the viewer manages — a single project's board passes just
   * that one id (or none), a cross-project board (the top-level Tasks tab)
   * passes every project they manage. Plain data, not a callback: a function
   * prop can't cross the Server Component -> Client Component boundary. */
  managedProjectIds?: string[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  // Re-sync when the server data refreshes — same render-time-adjustment
  // pattern as InterviewBoard (React's documented fix for a prop that
  // changes after the initial mount, without an extra Effect commit).
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function canDrag(task: Task) {
    return (
      viewerIsAdmin ||
      managedProjectIds.includes(task.projectId) ||
      task.assigneeId === viewerId
    );
  }

  function handleDrop(status: string) {
    setDragOverStatus(null);
    if (!draggedId) return;
    const id = draggedId;
    setDraggedId(null);
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status || !canDrag(task)) return;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    startTransition(async () => {
      await updateTaskStatus(id, status);
      router.refresh();
    });
  }

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;

  if (tasks.length === 0) {
    return <p className="text-sm text-foreground-muted">No tasks yet.</p>;
  }

  return (
    <>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((column) => {
          const items = tasks.filter((t) => t.status === column.status);
          const isDragOver = dragOverStatus === column.status;
          const styles = COLUMN_STYLES[column.status];

          return (
            <div
              key={column.status}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverStatus !== column.status) setDragOverStatus(column.status);
              }}
              onDragLeave={() => setDragOverStatus((s) => (s === column.status ? null : s))}
              onDrop={() => handleDrop(column.status)}
              className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-t-4 p-3 transition-colors ${styles.bar} ${
                isDragOver ? "border-accent bg-accent/10" : `border-border ${styles.wash}`
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden="true" />
                  <p className="text-xs font-medium text-foreground-muted">{column.label}</p>
                </span>
                <span className="text-xs text-foreground-muted">{items.length}</span>
              </div>

              <div className="flex min-h-[4rem] flex-col gap-2">
                {items.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-foreground-muted">
                    No tasks
                  </p>
                ) : (
                  items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canDrag={canDrag(task)}
                      onDragStart={() => setDraggedId(task.id)}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverStatus(null);
                      }}
                      onClick={() => setSelectedId(task.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask ? (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedId(null)} />
      ) : null}
    </>
  );
}
