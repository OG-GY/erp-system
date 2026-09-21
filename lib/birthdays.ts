import { prisma } from "@/lib/prisma";
import { todayDateOnly, daysUntilNextOccurrence } from "@/lib/date";

const UPCOMING_BIRTHDAY_WINDOW_DAYS = 30;

/**
 * Active employees whose next birthday (birth year ignored) falls within the
 * next 30 days, soonest first. Shared by the admin and employee dashboards —
 * birthday month/day is treated as non-sensitive, shown company-wide so
 * people know to wish a colleague well, same as any office birthday board.
 */
export async function getUpcomingBirthdays() {
  const today = todayDateOnly();

  const employees = await prisma.employee.findMany({
    where: { employmentStatus: "ACTIVE", dateOfBirth: { not: null } },
    select: { id: true, fullName: true, dateOfBirth: true },
  });

  return employees
    .map((e) => ({
      id: e.id,
      fullName: e.fullName,
      dateOfBirth: e.dateOfBirth!,
      daysUntil: daysUntilNextOccurrence(e.dateOfBirth!, today),
    }))
    .filter((e) => e.daysUntil <= UPCOMING_BIRTHDAY_WINDOW_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
