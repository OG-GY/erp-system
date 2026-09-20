"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Enter a department name.").max(200),
});

export type CreateDepartmentState = { error: string | null; success: boolean };

export async function createDepartment(
  _prevState: CreateDepartmentState,
  formData: FormData,
): Promise<CreateDepartmentState> {
  await requireAdmin();

  const parsed = createDepartmentSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the fields.",
      success: false,
    };
  }

  try {
    await prisma.department.create({ data: { name: parsed.data.name } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        error: "A department with this name already exists.",
        success: false,
      };
    }
    throw err;
  }

  // See docs/caching.md — the department list is cached; this is the write
  // path that must invalidate it, otherwise the "Add employee" dropdown and
  // Reports page would serve a stale list for up to 5 minutes.
  // { expire: 0 } = invalidate immediately, matching this app's classic
  // unstable_cache + tags model rather than the newer cacheLife "max"
  // profile (which is for "use cache", a model this app doesn't opt into
  // — see docs/caching.md's "which caching model" section).
  revalidateTag("departments", { expire: 0 });
  revalidatePath("/departments");

  return { error: null, success: true };
}
