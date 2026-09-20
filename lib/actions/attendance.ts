"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/auth";
import { todayDateOnly } from "@/lib/date";

export type AttendanceActionState = { error: string | null; success: boolean };

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Enter a valid time.");

/** Builds a Date at today's local calendar date + the given local H:M. */
function timeStringToToday(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}

export async function checkIn(
  _prevState: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const employee = await requireEmployee();

  const parsed = timeSchema.safeParse(formData.get("time"));
  if (!parsed.success) {
    return { error: "Enter a valid time.", success: false };
  }

  const checkInTime = timeStringToToday(parsed.data);
  if (checkInTime.getTime() > Date.now()) {
    return { error: "Check-in time can't be in the future.", success: false };
  }

  const date = todayDateOnly();
  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
  });

  if (existing?.checkIn) {
    return { error: "You already checked in today.", success: false };
  }

  await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId: employee.id, date } },
    create: {
      employeeId: employee.id,
      date,
      checkIn: checkInTime,
      status: "PRESENT",
    },
    update: { checkIn: checkInTime, status: "PRESENT" },
  });

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function checkOut(): Promise<AttendanceActionState> {
  const employee = await requireEmployee();
  const date = todayDateOnly();

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
    include: { breaks: { where: { endedAt: null } } },
  });

  if (!existing?.checkIn) {
    return { error: "Check in before checking out.", success: false };
  }
  if (existing.checkOut) {
    return { error: "You already checked out today.", success: false };
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: now },
    }),
    // Auto-close any still-open break rather than leaving it dangling.
    ...existing.breaks.map((b) =>
      prisma.attendanceBreak.update({
        where: { id: b.id },
        data: { endedAt: now },
      }),
    ),
  ]);

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function startBreak(): Promise<AttendanceActionState> {
  const employee = await requireEmployee();
  const date = todayDateOnly();

  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
    include: { breaks: { where: { endedAt: null } } },
  });

  if (!record?.checkIn) {
    return { error: "Check in before starting a break.", success: false };
  }
  if (record.checkOut) {
    return { error: "You've already checked out today.", success: false };
  }
  if (record.breaks.length > 0) {
    return { error: "You're already on a break.", success: false };
  }

  await prisma.attendanceBreak.create({
    data: { attendanceRecordId: record.id, startedAt: new Date() },
  });

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function resumeFromBreak(): Promise<AttendanceActionState> {
  const employee = await requireEmployee();
  const date = todayDateOnly();

  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
    include: { breaks: { where: { endedAt: null }, take: 1 } },
  });

  const openBreak = record?.breaks[0];
  if (!openBreak) {
    return { error: "You're not currently on a break.", success: false };
  }

  await prisma.attendanceBreak.update({
    where: { id: openBreak.id },
    data: { endedAt: new Date() },
  });

  revalidatePath("/dashboard");
  return { error: null, success: true };
}
