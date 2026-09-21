"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Shared by createEmployee and updateEmployeeSalary — "not set yet" is a
// valid choice (salaryType absent), otherwise the matching amount is
// required.
const salaryFieldsSchema = z
  .object({
    salaryType: z.enum(["FIXED", "COMMISSION"]).optional(),
    baseSalary: z.coerce.number().nonnegative().optional(),
    commissionPerProject: z.coerce.number().nonnegative().optional(),
  })
  .refine((data) => data.salaryType !== "FIXED" || data.baseSalary !== undefined, {
    message: "Enter a base salary.",
    path: ["baseSalary"],
  })
  .refine(
    (data) =>
      data.salaryType !== "COMMISSION" ||
      data.commissionPerProject !== undefined,
    { message: "Enter a commission amount.", path: ["commissionPerProject"] },
  );

function readSalaryFields(formData: FormData) {
  const salaryTypeRaw = formData.get("salaryType");
  return {
    salaryType:
      salaryTypeRaw === "FIXED" || salaryTypeRaw === "COMMISSION"
        ? salaryTypeRaw
        : undefined,
    baseSalary: formData.get("baseSalary") || undefined,
    commissionPerProject: formData.get("commissionPerProject") || undefined,
  };
}

function salaryUpdateData(salary: z.infer<typeof salaryFieldsSchema>) {
  return {
    salaryType: salary.salaryType ?? null,
    baseSalary: salary.salaryType === "FIXED" ? salary.baseSalary : null,
    commissionPerProject:
      salary.salaryType === "COMMISSION" ? salary.commissionPerProject : null,
  };
}

const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().min(1).max(200),
  designation: z.string().max(200).optional(),
  role: z.enum(["SUPER_ADMIN", "HR_MANAGER", "MANAGER", "EMPLOYEE"]),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "INTERN", "CONTRACT"]),
  joiningDate: z.string().min(1),
  departmentId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  idCardNumber: z.string().max(50).optional(),
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
    dateOfBirth: formData.get("dateOfBirth") || undefined,
    idCardNumber: formData.get("idCardNumber") || undefined,
  };

  const parsed = createEmployeeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }
  const data = parsed.data;

  const salaryParsed = salaryFieldsSchema.safeParse(readSalaryFields(formData));
  if (!salaryParsed.success) {
    return {
      error: salaryParsed.error.issues[0]?.message ?? "Please check the salary fields.",
    };
  }

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
    // Derived from the highest employeeNumber ever issued, not the current
    // row count — count() drops when an employee is deleted, which would
    // regenerate an already-used number and collide on the unique
    // constraint. Zero-padding to a fixed width keeps lexicographic order
    // equal to numeric order, so ordering by the string column is safe.
    let attempt = 0;
    for (;;) {
      const last = await prisma.employee.findFirst({
        orderBy: { employeeNumber: "desc" },
        select: { employeeNumber: true },
      });
      const lastN = last
        ? parseInt(last.employeeNumber.replace(/^EMP-/, ""), 10) || 0
        : 0;
      const employeeNumber = `EMP-${String(lastN + 1).padStart(4, "0")}`;

      try {
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
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            idCardNumber: data.idCardNumber || null,
            ...salaryUpdateData(salaryParsed.data),
          },
        });
        break;
      } catch (err) {
        attempt += 1;
        const isNumberConflict =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          (err.meta?.target as string[] | undefined)?.includes("employeeNumber");
        // A concurrent create can still race us for the same number —
        // regenerate and retry a few times before giving up.
        if (!isNumberConflict || attempt >= 5) throw err;
      }
    }
  } catch (err) {
    // Roll back the auth user so we don't leave an orphaned login with no
    // Employee row — the two writes aren't in one transaction.
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw err;
  }

  revalidatePath("/employees");
  redirect("/employees");
}

export type UpdateSalaryState = { error: string | null; success: boolean };

export async function updateEmployeeSalary(
  employeeId: string,
  _prevState: UpdateSalaryState,
  formData: FormData,
): Promise<UpdateSalaryState> {
  await requireAdmin();

  const parsed = salaryFieldsSchema.safeParse(readSalaryFields(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid amount.",
      success: false,
    };
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: salaryUpdateData(parsed.data),
  });

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/profile");
  return { error: null, success: true };
}

// Mirrors the admin-only field set from createEmployee — the same fields an
// admin sets at creation time stay editable afterward. Email and self-service
// fields (phone, personal details) are deliberately absent: email is tied to
// the Supabase Auth identity, and self-service fields already have their own
// action (updateMyProfile).
const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).max(200),
  designation: z.string().max(200).optional(),
  role: z.enum(["SUPER_ADMIN", "HR_MANAGER", "MANAGER", "EMPLOYEE"]),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "INTERN", "CONTRACT"]),
  employmentStatus: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]),
  joiningDate: z.string().min(1),
  departmentId: z.string().optional(),
  idCardNumber: z.string().max(50).optional(),
});

export type UpdateEmployeeState = { error: string | null; success: boolean };

export async function updateEmployeeDetails(
  employeeId: string,
  _prevState: UpdateEmployeeState,
  formData: FormData,
): Promise<UpdateEmployeeState> {
  const admin = await requireAdmin();

  const parsed = updateEmployeeSchema.safeParse({
    fullName: formData.get("fullName"),
    designation: formData.get("designation") || undefined,
    role: formData.get("role"),
    employmentType: formData.get("employmentType"),
    employmentStatus: formData.get("employmentStatus"),
    joiningDate: formData.get("joiningDate"),
    departmentId: formData.get("departmentId") || undefined,
    idCardNumber: formData.get("idCardNumber") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the fields.",
      success: false,
    };
  }
  const data = parsed.data;

  // Guard against locking yourself out of the admin views by demoting or
  // deactivating your own account through this form.
  if (employeeId === admin.id) {
    if (data.role === "EMPLOYEE") {
      return { error: "You can't remove your own admin access.", success: false };
    }
    if (data.employmentStatus !== "ACTIVE") {
      return { error: "You can't deactivate your own account.", success: false };
    }
  }

  if (data.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { id: true },
    });
    if (!department) {
      return { error: "Selected department no longer exists.", success: false };
    }
  }

  const current = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { employmentStatus: true },
  });
  if (!current) {
    return { error: "Employee not found.", success: false };
  }

  const becomingTerminated =
    data.employmentStatus === "TERMINATED" && current.employmentStatus !== "TERMINATED";
  const leavingTerminated =
    data.employmentStatus !== "TERMINATED" && current.employmentStatus === "TERMINATED";

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      fullName: data.fullName,
      designation: data.designation || null,
      role: data.role,
      employmentType: data.employmentType,
      employmentStatus: data.employmentStatus,
      joiningDate: new Date(data.joiningDate),
      departmentId: data.departmentId || null,
      idCardNumber: data.idCardNumber || null,
      ...(becomingTerminated ? { terminationDate: new Date() } : {}),
      ...(leavingTerminated ? { terminationDate: null } : {}),
    },
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  return { error: null, success: true };
}

export type SuspendEmployeeState = { error: string | null };

/**
 * Quick toggle between ACTIVE and INACTIVE — the common case. Other status
 * changes (ON_LEAVE, TERMINATED) go through the full edit form instead.
 * Suspension is actually enforced in requireEmployee() (lib/auth.ts), which
 * signs the employee out the next time they hit a protected route.
 */
export async function setEmployeeSuspended(
  employeeId: string,
  suspend: boolean,
): Promise<SuspendEmployeeState> {
  const admin = await requireAdmin();
  if (employeeId === admin.id) {
    return { error: "You can't suspend your own account." };
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { employmentStatus: true },
  });
  if (!employee) {
    return { error: "Employee not found." };
  }
  if (employee.employmentStatus !== "ACTIVE" && employee.employmentStatus !== "INACTIVE") {
    return { error: "Use Edit to change status for this employee." };
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { employmentStatus: suspend ? "INACTIVE" : "ACTIVE" },
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  return { error: null };
}

export type DeleteEmployeeState = { error: string | null };

/**
 * Employees accumulate attendance, task, payroll, and other history rows
 * with no cascade delete (by design — those are records we never want to
 * silently lose). Deleting only succeeds for an employee with no history at
 * all; the FK violation Postgres raises for anyone else is translated into a
 * plain instruction to suspend instead of exposing the raw DB error.
 */
export async function deleteEmployee(
  employeeId: string,
): Promise<DeleteEmployeeState> {
  const admin = await requireAdmin();
  if (employeeId === admin.id) {
    return { error: "You can't delete your own account." };
  }

  try {
    await prisma.employee.delete({ where: { id: employeeId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003") {
        return {
          error:
            "This employee has existing records (attendance, tasks, payroll, etc.) and can't be deleted. Suspend them instead.",
        };
      }
      if (err.code === "P2025") {
        return { error: "Employee not found." };
      }
    }
    throw err;
  }

  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.auth.admin.deleteUser(employeeId);

  revalidatePath("/employees");
  redirect("/employees");
}
