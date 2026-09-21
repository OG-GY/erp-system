"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/auth";
import { todayDateOnly } from "@/lib/date";
import { findOpenRecord, autoCheckOutIfStale } from "@/lib/attendance";

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

  // A still-open shift blocks a new check-in regardless of what calendar
  // date it's dated under — this is what makes an overnight shift work
  // correctly: you can't start a second one until you check out of the
  // first, even after the calendar date has rolled over past midnight.
  const openRecord = await findOpenRecord(employee.id);
  if (openRecord) {
    return { error: "You're already checked in.", success: false };
  }

  const date = todayDateOnly();
  const existingToday = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
  });

  if (existingToday?.checkIn) {
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

const standupSchema = z
  .string()
  .trim()
  .min(1, "Enter a standup before checking out.")
  .max(4000, "Keep the standup under 4000 characters.");

export async function checkOut(
  _prevState: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const employee = await requireEmployee();

  const parsedStandup = standupSchema.safeParse(formData.get("standup"));
  if (!parsedStandup.success) {
    return {
      error: parsedStandup.error.issues[0]?.message ?? "Enter a standup.",
      success: false,
    };
  }

  const existing = await findOpenRecord(employee.id);
  if (!existing) {
    return { error: "Check in before checking out.", success: false };
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: now, standup: parsedStandup.data },
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

  const record = await findOpenRecord(employee.id);
  if (!record) {
    return { error: "Check in before starting a break.", success: false };
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

/**
 * Called by the client-side timer in CheckInCard once the auto-checkout
 * limit has passed since check-in. The client is only a wake-up call — this
 * re-verifies checkIn server-side (autoCheckOutIfStale) before closing
 * anything, so a fast, slow, or tampered client clock can't force an early
 * or fake checkout.
 */
export async function checkAutoCheckOut(): Promise<AttendanceActionState> {
  const employee = await requireEmployee();
  const closed = await autoCheckOutIfStale(employee.id);
  if (closed) {
    revalidatePath("/dashboard");
  }
  return { error: null, success: closed };
}

export async function resumeFromBreak(): Promise<AttendanceActionState> {
  const employee = await requireEmployee();

  const record = await findOpenRecord(employee.id);
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
