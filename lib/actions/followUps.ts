"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee, canManageLead } from "@/lib/auth";

async function requireFollowUpAccess(followUpId: string) {
  const employee = await requireEmployee();
  const followUp = await prisma.followUp.findUnique({
    where: { id: followUpId },
    select: { leadId: true, lead: { select: { ownerId: true } } },
  });
  if (!followUp) {
    return { employee, followUp: null, allowed: false };
  }
  return { employee, followUp, allowed: canManageLead(employee, followUp.lead) };
}

export async function completeFollowUp(followUpId: string) {
  const { followUp, allowed } = await requireFollowUpAccess(followUpId);
  if (!followUp) throw new Error("Follow-up not found.");
  if (!allowed) throw new Error("Forbidden: you can't manage this follow-up.");

  await prisma.followUp.update({
    where: { id: followUpId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  revalidatePath("/leads");
  revalidatePath(`/leads/${followUp.leadId}`);
}

export async function cancelFollowUp(followUpId: string) {
  const { followUp, allowed } = await requireFollowUpAccess(followUpId);
  if (!followUp) throw new Error("Follow-up not found.");
  if (!allowed) throw new Error("Forbidden: you can't manage this follow-up.");

  await prisma.followUp.update({
    where: { id: followUpId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/leads");
  revalidatePath(`/leads/${followUp.leadId}`);
}

const dueDateSchema = z.object({ dueDate: z.string().min(1, "Pick a date.") });

export type RescheduleFollowUpState = { error: string | null };

export async function rescheduleFollowUp(
  followUpId: string,
  _prevState: RescheduleFollowUpState,
  formData: FormData,
): Promise<RescheduleFollowUpState> {
  const { followUp, allowed } = await requireFollowUpAccess(followUpId);
  if (!followUp) {
    return { error: "Follow-up not found." };
  }
  if (!allowed) {
    return { error: "Forbidden: you can't manage this follow-up." };
  }

  const parsed = dueDateSchema.safeParse({ dueDate: formData.get("dueDate") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid date." };
  }
  const dueDate = new Date(`${parsed.data.dueDate}T00:00:00.000Z`);

  await prisma.$transaction([
    prisma.followUp.update({ where: { id: followUpId }, data: { dueDate, status: "SCHEDULED" } }),
    prisma.lead.update({ where: { id: followUp.leadId }, data: { nextFollowUpDate: dueDate } }),
  ]);

  revalidatePath("/leads");
  revalidatePath(`/leads/${followUp.leadId}`);
  return { error: null };
}

const createFollowUpSchema = z.object({
  dueDate: z.string().min(1, "Pick a date."),
  action: z.string().min(1, "Enter the next action.").max(500),
});

export type CreateFollowUpState = { error: string | null };

export async function createFollowUp(
  leadId: string,
  _prevState: CreateFollowUpState,
  formData: FormData,
): Promise<CreateFollowUpState> {
  const employee = await requireEmployee();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true } });
  if (!lead) {
    return { error: "Lead not found." };
  }
  if (!canManageLead(employee, lead)) {
    return { error: "Forbidden: you can't manage this lead." };
  }

  const parsed = createFollowUpSchema.safeParse({
    dueDate: formData.get("dueDate"),
    action: formData.get("action"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }
  const dueDate = new Date(`${parsed.data.dueDate}T00:00:00.000Z`);

  await prisma.$transaction([
    prisma.followUp.create({
      data: { leadId, dueDate, action: parsed.data.action, assignedToId: employee.id },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: { nextFollowUpDate: dueDate, nextAction: parsed.data.action },
    }),
  ]);

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { error: null };
}
