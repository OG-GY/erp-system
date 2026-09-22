import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";

/**
 * Today's check-in status for every teammate across the given team ids
 * (deduplicated — someone on two of the same teams only appears once).
 * `teamIds` is passed in rather than looked up here, since callers on the
 * dashboard already have the caller's own team memberships loaded.
 */
export async function getTeammatesCheckInsToday(teamIds: string[]) {
  if (teamIds.length === 0) return [];

  const memberships = await prisma.teamMembership.findMany({
    where: { teamId: { in: teamIds } },
    select: {
      employeeId: true,
      employee: { select: { id: true, fullName: true } },
    },
  });

  const teammateById = new Map(memberships.map((m) => [m.employeeId, m.employee]));
  const teammates = [...teammateById.values()];

  const today = todayDateOnly();
  const records = await prisma.attendanceRecord.findMany({
    where: { employeeId: { in: teammates.map((t) => t.id) }, date: today },
    select: { employeeId: true, checkIn: true, checkOut: true },
  });
  const recordByEmployee = new Map(records.map((r) => [r.employeeId, r]));

  return teammates
    .map((t) => {
      const record = recordByEmployee.get(t.id);
      return {
        id: t.id,
        fullName: t.fullName,
        checkIn: record?.checkIn ?? null,
        checkOut: record?.checkOut ?? null,
      };
    })
    .sort((a, b) => {
      if (a.checkIn && b.checkIn) return a.checkIn.getTime() - b.checkIn.getTime();
      if (a.checkIn) return -1;
      if (b.checkIn) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
}
