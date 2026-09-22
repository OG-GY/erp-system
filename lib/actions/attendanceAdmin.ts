"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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
