import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

const STATUS_TONE = {
  PLANNING: "neutral",
  ACTIVE: "success",
  ON_HOLD: "warning",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
} as const;

const STATUS_LABEL = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
} as const;

export function AssignedProjectsCard({
  projects,
}: {
  projects: { id: string; name: string; status: keyof typeof STATUS_LABEL }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">Assigned projects</p>

      {projects.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          You&apos;re not assigned to any project yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects#${project.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-sm hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              >
                <span className="truncate text-foreground">{project.name}</span>
                <StatusBadge
                  label={STATUS_LABEL[project.status]}
                  tone={STATUS_TONE[project.status]}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
