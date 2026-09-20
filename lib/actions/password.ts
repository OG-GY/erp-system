"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee } from "@/lib/auth";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordState = { error: string | null; success: boolean };

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const employee = await requireEmployee();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the fields.",
      success: false,
    };
  }

  const supabase = await createClient();

  // Verify the current password before allowing a change — without this,
  // anyone at an unattended, still-logged-in session could lock the real
  // owner out of their own account. Supabase has no separate "verify
  // password" call; re-authenticating is the documented way to do this.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: employee.officialEmail,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return { error: "Current password is incorrect.", success: false };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return {
      error: "Could not update your password. Please try again.",
      success: false,
    };
  }

  return { error: null, success: true };
}
