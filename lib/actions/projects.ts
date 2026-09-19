"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateProjectState = { error: string | null };

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  await requireAdmin();

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }
  const data = parsed.data;

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function addProjectMember(projectId: string, formData: FormData) {
  await requireAdmin();
  const employeeId = formData.get("employeeId");
  if (typeof employeeId !== "string" || !employeeId) return;

  try {
    await prisma.projectMember.create({ data: { projectId, employeeId } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return; // already a member — no-op
    }
    throw err;
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectMember(
  projectId: string,
  employeeId: string,
) {
  await requireAdmin();
  await prisma.projectMember.delete({
    where: { projectId_employeeId: { projectId, employeeId } },
  });
  revalidatePath(`/projects/${projectId}`);
}

const createTaskSchema = z.object({
  title: z.string().min(1).max(300),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional(),
});

export type CreateTaskState = { error: string | null };

export async function createTask(
  projectId: string,
  _prevState: CreateTaskState,
  formData: FormData,
): Promise<CreateTaskState> {
  const admin = await requireAdmin();

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    assigneeId: formData.get("assigneeId") || undefined,
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }
  const data = parsed.data;

  await prisma.task.create({
    data: {
      projectId,
      title: data.title,
      assigneeId: data.assigneeId || null,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdById: admin.id,
      status: "TODO",
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}
