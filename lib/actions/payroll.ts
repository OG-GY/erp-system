"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const createPayslipSchema = z
  .object({
    employeeId: z.string().min(1),
    periodStart: z.string().min(1),
    periodEnd: z.string().min(1),
    basicSalary: z.coerce.number().nonnegative(),
    allowances: z.coerce.number().nonnegative().default(0),
    deductions: z.coerce.number().nonnegative().default(0),
    status: z.enum(["DRAFT", "APPROVED", "PAID"]),
  })
  .refine(
    (data) => new Date(data.periodEnd) >= new Date(data.periodStart),
    { message: "Period end must be on or after the start.", path: ["periodEnd"] },
  );

export type CreatePayslipState = { error: string | null };

export async function createPayslip(
  _prevState: CreatePayslipState,
  formData: FormData,
): Promise<CreatePayslipState> {
  await requireAdmin();

  const parsed = createPayslipSchema.safeParse({
    employeeId: formData.get("employeeId"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    basicSalary: formData.get("basicSalary"),
    allowances: formData.get("allowances") || 0,
    deductions: formData.get("deductions") || 0,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }
  const data = parsed.data;

  const netSalary = data.basicSalary + data.allowances - data.deductions;
  if (netSalary < 0) {
    return { error: "Net salary can't be negative — check allowances/deductions." };
  }

  try {
    await prisma.payslip.create({
      data: {
        employeeId: data.employeeId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        basicSalary: data.basicSalary,
        allowances: data.allowances,
        deductions: data.deductions,
        netSalary,
        status: data.status,
        paidAt: data.status === "PAID" ? new Date() : null,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "A payslip for this employee and period already exists." };
    }
    throw err;
  }

  revalidatePath("/payroll");
  redirect("/payroll");
}

const payslipStatusSchema = z.enum(["DRAFT", "APPROVED", "PAID"]);

export type UpdatePayslipStatusState = { error: string | null };

export async function updatePayslipStatus(
  payslipId: string,
  status: string,
): Promise<UpdatePayslipStatusState> {
  await requireAdmin();

  const parsed = payslipStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: "Invalid status." };
  }

  await prisma.payslip.update({
    where: { id: payslipId },
    data: {
      status: parsed.data,
      // Only a PAID payslip has a paidAt — moving off PAID clears it, same
      // as the initial value createPayslip sets when a slip starts PAID.
      paidAt: parsed.data === "PAID" ? new Date() : null,
    },
  });

  revalidatePath("/payroll");
  return { error: null };
}
