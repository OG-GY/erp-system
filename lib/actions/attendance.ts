"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/auth";
import { todayDateOnly } from "@/lib/date";

export type AttendanceActionState = { error: string | null };

export async function checkIn(): Promise<AttendanceActionState> {
  const employee = await requireEmployee();
  const date = todayDateOnly();

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
  });

  if (existing?.checkIn) {
    return { error: "You already checked in today." };
  }

  await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId: employee.id, date } },
    create: {
      employeeId: employee.id,
      date,
      checkIn: new Date(),
      status: "PRESENT",
    },
    update: { checkIn: new Date(), status: "PRESENT" },
  });

  revalidatePath("/dashboard");
  return { error: null };
}

export async function checkOut(): Promise<AttendanceActionState> {
  const employee = await requireEmployee();
  const date = todayDateOnly();

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
  });

  if (!existing?.checkIn) {
    return { error: "Check in before checking out." };
  }
  if (existing.checkOut) {
    return { error: "You already checked out today." };
  }

  await prisma.attendanceRecord.update({
    where: { employeeId_date: { employeeId: employee.id, date } },
    data: { checkOut: new Date() },
  });

  revalidatePath("/dashboard");
  return { error: null };
}
