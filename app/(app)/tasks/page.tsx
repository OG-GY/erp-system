import { PageHeader } from "@/components/layout/PageHeader";
import { TaskBoard } from "@/components/projects/TaskBoard";
import { requireEmployee, isAdmin, isProjectManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const taskSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  assigneeId: true,
  projectId: true,
  assignee: { select: { fullName: true } },
  project: { select: { id: true, name: true } },
} as const;

export default async function TasksPage() {
  const employee = await requireEmployee();
  const viewerIsAdmin = isAdmin(employee.role);

  let managedProjectIds = new Set<string>();
  let tasks;

  if (viewerIsAdmin) {
    tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: taskSelect,
    });
  } else if (isProjectManager(employee.role)) {
    const managed = await prisma.projectMember.findMany({
      where: { employeeId: employee.id, isManager: true },
      select: { projectId: true },
    });
    managedProjectIds = new Set(managed.map((m) => m.projectId));

    tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: employee.id },
          { projectId: { in: [...managedProjectIds] } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: taskSelect,
    });
  } else {
    tasks = await prisma.task.findMany({
      where: { assigneeId: employee.id },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: taskSelect,
    });
  }

  return (
    <>
      <PageHeader title="Tasks" description="Drag a card to update its status" />
      <div className="p-4 sm:p-6">
        <TaskBoard
          tasks={tasks}
          viewerId={employee.id}
          viewerIsAdmin={viewerIsAdmin}
          managedProjectIds={[...managedProjectIds]}
        />
      </div>
    </>
  );
}
