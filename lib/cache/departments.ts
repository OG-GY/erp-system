import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * The department list is shared and non-sensitive (just names/ids), so it's
 * safe to cache across users. See docs/caching.md.
 *
 * Write path: lib/actions/departments.ts's createDepartment calls
 * revalidateTag("departments") right after writing — any new write path
 * added later (rename/delete) MUST do the same, or this list will serve
 * stale data for up to 5 minutes.
 */
export const getCachedDepartments = unstable_cache(
  async () => {
    return prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  },
  ["departments-list"],
  { tags: ["departments"], revalidate: 300 },
);
