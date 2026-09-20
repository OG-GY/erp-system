import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * The department list is shared, non-sensitive (just names/ids), and has no
 * write path yet — nothing in the app creates/edits departments today. Safe
 * to cache across users. See docs/caching.md.
 *
 * If a "manage departments" feature is ever added, its create/update/delete
 * action MUST call `revalidateTag("departments")`, or this list will serve
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
