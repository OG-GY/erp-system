import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MyProjectsList } from "@/components/projects/MyProjectsList";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { requireEmployee, isAdmin, isProjectManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
              className="flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
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
                className="mt-2 flex h-9 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                New project
              </Link>
            </div>
          ) : (
            <ProjectsTable projects={projects} />
          )}
        </div>
      </>
    );
  }

  if (isProjectManager(employee.role)) {
    const [managedProjects, memberProjects] = await Promise.all([
      prisma.project.findMany({
        where: { members: { some: { employeeId: employee.id, isManager: true } } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          _count: { select: { members: true, tasks: true } },
        },
      }),
      prisma.project.findMany({
        where: { members: { some: { employeeId: employee.id, isManager: false } } },
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
      }),
    ]);

    return (
      <>
        <PageHeader
          title="Projects"
          description="Projects you manage, and projects you're on"
          actions={
            <Link
              href="/projects/new"
              className="flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              New project
            </Link>
          }
        />
        <div className="flex flex-col gap-6 p-4 sm:p-6">
          <section>
            <p className="mb-2 text-xs text-foreground-muted">
              Projects you manage — {managedProjects.length}
            </p>
            {managedProjects.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                You don&apos;t manage any project yet.
              </p>
            ) : (
              <ProjectsTable projects={managedProjects} />
            )}
          </section>

          <section>
            <p className="mb-2 text-xs text-foreground-muted">
              Projects you&apos;re on — {memberProjects.length}
            </p>
            <MyProjectsList projects={memberProjects} />
          </section>
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
