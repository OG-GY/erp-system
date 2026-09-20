import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MyProjectsList } from "@/components/projects/MyProjectsList";
import { requireEmployee, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export default async function ProjectsPage() {
  const employee = await requireEmployee();

  if (isAdmin(employee.role)) {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        status: true,
        _count: { select: { members: true, tasks: true } },
      },
    });

    return (
      <>
        <PageHeader
          title="Projects"
          description={`${projects.length} projects`}
          actions={
            <Link
              href="/projects/new"
              className="flex h-8 items-center rounded-full bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              New project
            </Link>
          }
        />
        <div className="p-4 sm:p-6">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-sm font-medium text-foreground">No projects yet</p>
              <Link
                href="/projects/new"
                className="mt-2 flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                New project
              </Link>
            </div>
          ) : (
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
          )}
        </div>
      </>
    );
  }

  const projects = await prisma.project.findMany({
    where: { members: { some: { employeeId: employee.id } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      tasks: {
        where: { assigneeId: employee.id },
        orderBy: { dueDate: "asc" },
        select: { id: true, title: true, status: true, dueDate: true },
      },
    },
  });

  return (
    <>
      <PageHeader title="Projects" description="Projects you're assigned to" />
      <div className="p-4 sm:p-6">
        <MyProjectsList projects={projects} />
      </div>
    </>
  );
}
