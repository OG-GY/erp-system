"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/auth";
import { todayDateOnly } from "@/lib/date";
import { findOpenRecord, autoCheckOutIfStale } from "@/lib/attendance";

export type AttendanceActionState = { error: string | null; success: boolean };

// A full ISO timestamp, not a bare "HH:MM" — the browser resolves the
// picked time against the employee's own clock/timezone before sending it,
// so the server never has to guess what timezone the digits were meant in
// (which broke on Vercel: the server runs in UTC, so a bare "15:00" from a
// Pakistan-time browser got read as 15:00 UTC — 5 hours ahead of the real
// moment, tripping the "can't be in the future" check for an entirely
// ordinary present-time check-in).
//
// checkInDate is sent separately, as the plain "YYYY-MM-DD" the employee
// picked — deliberately not re-derived from checkInTime here, since doing
// that would need to know the employee's timezone again, the exact
// ambiguity checkInIso exists to avoid.
const checkInSchema = z.object({
  checkInIso: z
    .string()
    .min(1, "Enter a check-in time.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid check-in time.",
    }),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
});

export async function checkIn(
  _prevState: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const employee = await requireEmployee();

  const parsed = checkInSchema.safeParse({
    checkInIso: formData.get("checkInIso"),
    checkInDate: formData.get("checkInDate"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid time.",
      success: false,
    };
  }

  const checkInTime = new Date(parsed.data.checkInIso);
  if (checkInTime.getTime() > Date.now()) {
    return { error: "Check-in time can't be in the future.", success: false };
  }

  // A date-only string parses as UTC midnight per the ES spec, matching
  // how @db.Date columns round-trip — same convention as todayDateOnly().
  const date = new Date(parsed.data.checkInDate);
  const today = todayDateOnly();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (date.getTime() > today.getTime() || date.getTime() < yesterday.getTime()) {
    return {
      error: "You can only check in for today or yesterday.",
      success: false,
    };
  }

  // A still-open shift blocks a new check-in regardless of what calendar
  // date it's dated under — this is what makes an overnight shift work
  // correctly: you can't start a second one until you check out of the
  // first, even after the calendar date has rolled over past midnight.
  const openRecord = await findOpenRecord(employee.id);
  if (openRecord) {
    return { error: "You're already checked in.", success: false };
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
  });

  if (existing?.checkIn) {
    return { error: "You already checked in for that day.", success: false };
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
