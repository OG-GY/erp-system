import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

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

type Project = {
  id: string;
  name: string;
  status: keyof typeof PROJECT_STATUS_LABEL;
  _count: { members: number; tasks: number };
};

export function ProjectsTable({ projects }: { projects: Project[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-foreground-muted">
            <th className="px-4 py-2 font-medium">Project</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Members</th>
            <th className="px-4 py-2 font-medium">Tasks</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-medium">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-foreground hover:text-accent"
                >
                  {project.name}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge
                  label={PROJECT_STATUS_LABEL[project.status]}
                  tone={PROJECT_STATUS_TONE[project.status]}
                />
              </td>
              <td className="px-4 py-2.5 text-foreground-muted">
                {project._count.members}
              </td>
              <td className="px-4 py-2.5 text-foreground-muted">
                {project._count.tasks}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
