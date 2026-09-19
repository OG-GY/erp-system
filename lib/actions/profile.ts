"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/auth";

// Explicit allowlist: only these fields are self-editable. Role, salary,
// designation, department, employment status/type, and dates are admin/HR
// controlled and are intentionally absent from this schema and action —
// mass-assignment from the client is not possible here even if the form
// were tampered with, because unknown fields are simply not read.
const updateProfileSchema = z.object({
  personalEmail: z.string().email().or(z.literal("")).nullable(),
  phone: z.string().max(30).or(z.literal("")).nullable(),
  dateOfBirth: z.string().or(z.literal("")).nullable(),
  gender: z.string().max(50).or(z.literal("")).nullable(),
  residentialAddress: z.string().max(500).or(z.literal("")).nullable(),
  emergencyContactName: z.string().max(200).or(z.literal("")).nullable(),
  emergencyContactPhone: z.string().max(30).or(z.literal("")).nullable(),
});

export type UpdateProfileState = { error: string | null; success: boolean };

export async function updateMyProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const employee = await requireEmployee();

  const parsed = updateProfileSchema.safeParse({
    personalEmail: formData.get("personalEmail"),
    phone: formData.get("phone"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
    residentialAddress: formData.get("residentialAddress"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
  });

  if (!parsed.success) {
    return { error: "Please check the fields and try again.", success: false };
  }

  const { dateOfBirth, ...rest } = parsed.data;

  // Update by the authenticated employee's own id only — never trust a
  // client-supplied id (object-level authorization).
  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      personalEmail: rest.personalEmail || null,
      phone: rest.phone || null,
      gender: rest.gender || null,
      residentialAddress: rest.residentialAddress || null,
      emergencyContactName: rest.emergencyContactName || null,
      emergencyContactPhone: rest.emergencyContactPhone || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    },
  });

  revalidatePath("/profile");
  return { error: null, success: true };
}
