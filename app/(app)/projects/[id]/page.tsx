import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MembersPanel } from "@/components/projects/MembersPanel";
import { TasksPanel } from "@/components/projects/TasksPanel";
import { requireEmployee, isAdmin, canManageProject } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[id]">) {
  const employee = await requireEmployee();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      members: {
        select: {
          isManager: true,
          employee: { select: { id: true, fullName: true } },
        },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: { select: { fullName: true } },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const canManage = await canManageProject(employee, id);
  const isMember = canManage || project.members.some((m) => m.employee.id === employee.id);
  if (!isAdmin(employee.role) && !isMember) {
    redirect("/projects");
  }

  const memberIds = new Set(project.members.map((m) => m.employee.id));
  const availableEmployees = canManage
    ? await prisma.employee.findMany({
        where: { id: { notIn: [...memberIds] }, employmentStatus: "ACTIVE" },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true },
        take: 500,
      })
    : [];

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
        actions={
          <StatusBadge
            label={STATUS_LABEL[project.status]}
            tone={STATUS_TONE[project.status]}
          />
        }
      />
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MembersPanel
            projectId={project.id}
            members={project.members.map((m) => ({ ...m.employee, isManager: m.isManager }))}
            availableEmployees={availableEmployees}
            canManage={canManage}
            viewerIsAdmin={isAdmin(employee.role)}
          />
        </div>
        <div className="lg:col-span-2">
          <TasksPanel
            projectId={project.id}
            tasks={project.tasks}
            members={project.members.map((m) => m.employee)}
            canManage={canManage}
          />
        </div>
      </div>
    </>
  );
}
