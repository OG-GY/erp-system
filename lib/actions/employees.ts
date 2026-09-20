"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().min(1).max(200),
  designation: z.string().max(200).optional(),
  role: z.enum(["SUPER_ADMIN", "HR_MANAGER", "MANAGER", "EMPLOYEE"]),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "INTERN", "CONTRACT"]),
  joiningDate: z.string().min(1),
  departmentId: z.string().optional(),
});

export type CreateEmployeeState = { error: string | null };

export async function createEmployee(
  _prevState: CreateEmployeeState,
  formData: FormData,
): Promise<CreateEmployeeState> {
  await requireAdmin();

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    designation: formData.get("designation") || undefined,
    role: formData.get("role"),
    employmentType: formData.get("employmentType"),
    joiningDate: formData.get("joiningDate"),
    departmentId: formData.get("departmentId") || undefined,
  };

  const parsed = createEmployeeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }
  const data = parsed.data;

  const existing = await prisma.employee.findUnique({
    where: { officialEmail: data.email },
    select: { id: true },
  });
  if (existing) {
    return { error: "An employee with this email already exists." };
  }

  if (data.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { id: true },
    });
    if (!department) {
      return { error: "Selected department no longer exists." };
    }
  }

  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Could not create the account." };
  }

  try {
    const employeeCount = await prisma.employee.count();
    const employeeNumber = `EMP-${String(employeeCount + 1).padStart(4, "0")}`;

    await prisma.employee.create({
      data: {
        id: authData.user.id,
        employeeNumber,
        fullName: data.fullName,
        officialEmail: data.email,
        role: data.role,
        designation: data.designation || null,
        employmentType: data.employmentType,
        employmentStatus: "ACTIVE",
        joiningDate: new Date(data.joiningDate),
        departmentId: data.departmentId || null,
      },
    });
  } catch (err) {
    // Roll back the auth user so we don't leave an orphaned login with no
    // Employee row — the two writes aren't in one transaction.
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw err;
  }

  revalidatePath("/employees");
  redirect("/employees");
}

const salarySchema = z.discriminatedUnion("salaryType", [
  z.object({
    salaryType: z.literal("FIXED"),
    baseSalary: z.coerce.number().nonnegative(),
  }),
  z.object({
    salaryType: z.literal("COMMISSION"),
    commissionPerProject: z.coerce.number().nonnegative(),
  }),
]);

export type UpdateSalaryState = { error: string | null; success: boolean };

export async function updateEmployeeSalary(
  employeeId: string,
  _prevState: UpdateSalaryState,
  formData: FormData,
): Promise<UpdateSalaryState> {
  await requireAdmin();

  const salaryType = formData.get("salaryType");
  const raw =
    salaryType === "COMMISSION"
      ? {
          salaryType: "COMMISSION" as const,
          commissionPerProject: formData.get("commissionPerProject"),
        }
      : {
          salaryType: "FIXED" as const,
          baseSalary: formData.get("baseSalary"),
        };

  const parsed = salarySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid amount.",
      success: false,
    };
  }
  const data = parsed.data;

  await prisma.employee.update({
    where: { id: employeeId },
    data:
      data.salaryType === "FIXED"
        ? {
            salaryType: "FIXED",
            baseSalary: data.baseSalary,
            commissionPerProject: null,
          }
        : {
            salaryType: "COMMISSION",
            commissionPerProject: data.commissionPerProject,
            baseSalary: null,
          },
  });

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/profile");
  return { error: null, success: true };
}
