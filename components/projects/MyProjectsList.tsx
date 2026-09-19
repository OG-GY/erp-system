import { StatusBadge } from "@/components/ui/StatusBadge";
import { TaskStatusSelect } from "@/components/projects/TaskStatusSelect";

const PROJECT_STATUS_TONE = {
  PLANNING: "neutral",
  ACTIVE: "success",
  ON_HOLD: "warning",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
} as const;

const PROJECT_STATUS_LABEL = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
} as const;

type Task = {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: keyof typeof PROJECT_STATUS_LABEL;
  tasks: Task[];
};

export function MyProjectsList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
        <p className="text-sm font-medium text-foreground">
          You&apos;re not assigned to any project yet
        </p>
        <p className="text-sm text-foreground-muted">
          Projects you&apos;re added to will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {projects.map((project) => (
        <section
          key={project.id}
          id={project.id}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {project.name}
              </h3>
              {project.description ? (
                <p className="text-xs text-foreground-muted">
                  {project.description}
                </p>
              ) : null}
            </div>
            <StatusBadge
              label={PROJECT_STATUS_LABEL[project.status]}
              tone={PROJECT_STATUS_TONE[project.status]}
            />
          </div>

          {project.tasks.length === 0 ? (
            <p className="text-xs text-foreground-muted">
              No tasks assigned to you on this project.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {project.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <span className="truncate text-foreground">{task.title}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {task.dueDate ? (
                      <span className="text-xs text-foreground-muted">
                        Due{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeZone: "UTC",
                        }).format(task.dueDate)}
                      </span>
                    ) : null}
                    <TaskStatusSelect taskId={task.id} status={task.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
