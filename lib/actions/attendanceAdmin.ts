"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { todayDateOnly } from "@/lib/date";

// Full ISO timestamps, not the raw datetime-local strings the inputs use —
// those carry no timezone, so parsing them here would resolve them in the
// server's own runtime timezone (UTC on Vercel) rather than the admin's.
// EditAttendanceModal resolves them against the admin's browser first.
const updateAttendanceSchema = z
  .object({
    checkInIso: z
      .string()
      .min(1, "Enter a check-in time.")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: "Enter a valid check-in time.",
      }),
    checkOutIso: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.checkOutIso ||
      new Date(data.checkOutIso) > new Date(data.checkInIso),
    { message: "Check-out must be after check-in.", path: ["checkOutIso"] },
  );

export type UpdateAttendanceRecordState = { error: string | null; success: boolean };

/**
 * Admin correction of a check-in/check-out time. Takes full timestamps
 * (not just a time-of-day) rather than combining with the record's `date`
 * field, since an overnight shift's checkOut legitimately falls on the
 * next calendar day — this sidesteps having to re-derive that.
 */
export async function updateAttendanceRecord(
  recordId: string,
  _prevState: UpdateAttendanceRecordState,
  formData: FormData,
): Promise<UpdateAttendanceRecordState> {
  await requireAdmin();

  const parsed = updateAttendanceSchema.safeParse({
    checkInIso: formData.get("checkInIso"),
    checkOutIso: formData.get("checkOutIso") || undefined,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the fields.",
      success: false,
    };
  }

  await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: {
      checkIn: new Date(parsed.data.checkInIso),
      checkOut: parsed.data.checkOutIso
        ? new Date(parsed.data.checkOutIso)
        : null,
    },
  });

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

const createAttendanceSchema = z
  .object({
    employeeId: z.string().min(1, "Select an employee."),
    date: z
      .string()
      .min(1, "Pick a date.")
      .refine(
        (value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()),
        { message: "Enter a valid date." },
      ),
    checkInIso: z
      .string()
      .min(1, "Enter a check-in time.")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: "Enter a valid check-in time.",
      }),
    checkOutIso: z.string().optional(),
    standup: z
      .string()
      .max(4000, "Keep the standup under 4000 characters.")
      .optional(),
  })
  .refine(
    (data) =>
      !data.checkOutIso ||
      new Date(data.checkOutIso) > new Date(data.checkInIso),
    { message: "Check-out must be after check-in.", path: ["checkOutIso"] },
  );

export type CreateAttendanceRecordState = { error: string | null; success: boolean };

/**
 * Admin-created attendance record for a day an employee forgot to check in.
 * Same computed-ISO pattern as updateAttendanceRecord — the modal resolves
 * the date + time fields into unambiguous ISO timestamps client-side first.
 */
export async function createAttendanceRecord(
  _prevState: CreateAttendanceRecordState,
  formData: FormData,
): Promise<CreateAttendanceRecordState> {
  await requireAdmin();

  const parsed = createAttendanceSchema.safeParse({
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    checkInIso: formData.get("checkInIso"),
    checkOutIso: formData.get("checkOutIso") || undefined,
    standup: formData.get("standup") || undefined,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the fields.",
      success: false,
    };
  }

  const date = new Date(`${parsed.data.date}T00:00:00.000Z`);
  if (date.getTime() > todayDateOnly().getTime()) {
    return { error: "Can't add a record for a future date.", success: false };
  }

  try {
    await prisma.attendanceRecord.create({
      data: {
        employeeId: parsed.data.employeeId,
        date,
        checkIn: new Date(parsed.data.checkInIso),
        checkOut: parsed.data.checkOutIso
          ? new Date(parsed.data.checkOutIso)
          : null,
        standup: parsed.data.standup || null,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        error: "This employee already has a record for that date — edit it instead.",
        success: false,
      };
    }
    throw err;
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export type DeleteAttendanceRecordState = { error: string | null };

export async function deleteAttendanceRecord(
  recordId: string,
): Promise<DeleteAttendanceRecordState> {
  await requireAdmin();

  // AttendanceBreak has no cascade delete (by design, same as the rest of
  // the schema — see deleteEmployee's comment in lib/actions/employees.ts),
  // so its rows have to go first.
  await prisma.$transaction([
    prisma.attendanceBreak.deleteMany({ where: { attendanceRecordId: recordId } }),
    prisma.attendanceRecord.delete({ where: { id: recordId } }),
  ]);

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { error: null };
}
