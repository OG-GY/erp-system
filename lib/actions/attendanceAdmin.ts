"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const updateAttendanceSchema = z
  .object({
    checkIn: z.string().min(1, "Enter a check-in time."),
    checkOut: z.string().optional(),
  })
  .refine(
    (data) => !data.checkOut || new Date(data.checkOut) > new Date(data.checkIn),
    { message: "Check-out must be after check-in.", path: ["checkOut"] },
  );

export type UpdateAttendanceRecordState = { error: string | null; success: boolean };

/**
 * Admin correction of a check-in/check-out time. Takes full datetime-local
 * values (not just a time-of-day) rather than combining with the record's
 * `date` field, since an overnight shift's checkOut legitimately falls on
 * the next calendar day — this sidesteps having to re-derive that.
 */
export async function updateAttendanceRecord(
  recordId: string,
  _prevState: UpdateAttendanceRecordState,
  formData: FormData,
): Promise<UpdateAttendanceRecordState> {
  await requireAdmin();

  const parsed = updateAttendanceSchema.safeParse({
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut") || undefined,
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
      checkIn: new Date(parsed.data.checkIn),
      checkOut: parsed.data.checkOut ? new Date(parsed.data.checkOut) : null,
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
