import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";

/**
 * Employees on approved leave covering today, soonest-ending first. Shared
 * by the admin and employee dashboards — so HR/management know who's out
 * today, and so employees can see the same thing and not disturb them.
 */
export async function getEmployeesOnLeaveToday() {
  const today = todayDateOnly();

  return prisma.leaveRequest.findMany({
    where: {
      status: "APPROVED",
      startDate: { lte: today },
      endDate: { gte: today },
    },
    orderBy: { endDate: "asc" },
    select: {
      id: true,
      leaveType: true,
      startDate: true,
      endDate: true,
      employee: { select: { id: true, fullName: true, designation: true } },
    },
  });
}
