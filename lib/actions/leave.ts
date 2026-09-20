"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee, requireAdmin } from "@/lib/auth";

const applySchema = z
  .object({
    leaveType: z.enum(["CASUAL", "SICK", "ANNUAL", "UNPAID", "EMERGENCY"]),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    reason: z.string().min(1).max(1000),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export type LeaveActionState = { error: string | null; success: boolean };

export async function applyForLeave(
  _prevState: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  const employee = await requireEmployee();

  const parsed = applySchema.safeParse({
    leaveType: formData.get("leaveType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the fields.",
      success: false,
    };
  }

  const { leaveType, startDate, endDate, reason } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysCount =
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  await prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      leaveType,
      startDate: start,
      endDate: end,
      daysCount,
      reason,
      status: "PENDING",
    },
  });

  revalidatePath("/leave");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function cancelLeaveRequest(leaveRequestId: string) {
  const employee = await requireEmployee();

  const request = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
  });

  if (!request || request.employeeId !== employee.id) {
    throw new Error("Not found.");
  }
  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be cancelled.");
  }

  await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/leave");
  revalidatePath("/dashboard");
}

export async function approveLeaveRequest(leaveRequestId: string) {
  const admin = await requireAdmin();

  await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: { status: "APPROVED", approverId: admin.id, approvedAt: new Date() },
  });

  revalidatePath("/leave");
  revalidatePath("/dashboard");
}

export async function rejectLeaveRequest(leaveRequestId: string) {
  const admin = await requireAdmin();

  await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: {
      status: "REJECTED",
      approverId: admin.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/leave");
  revalidatePath("/dashboard");
}
