"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee, isAdmin } from "@/lib/auth";

const statusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
]);

export async function updateTaskStatus(taskId: string, status: string) {
  const employee = await requireEmployee();

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error("Invalid status.");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { assigneeId: true, projectId: true },
  });
  if (!task) {
    throw new Error("Task not found.");
  }

  const canEdit = isAdmin(employee.role) || task.assigneeId === employee.id;
  if (!canEdit) {
    throw new Error("Forbidden: you can only update your own tasks.");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: parsed.data },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${task.projectId}`);
}
