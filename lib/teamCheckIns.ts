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

/**
 * Check-in time per team member per day, across a date range — the series
 * behind the "check-in times" trend chart. `startDate`/`endDate` must be
 * UTC-midnight Dates (matching @db.Date columns, same convention as
 * todayDateOnly()).
 */
export async function getTeamCheckInTimeSeries(
  teamId: string,
  startDate: Date,
  endDate: Date,
) {
  const memberships = await prisma.teamMembership.findMany({
    where: { teamId },
    select: { employee: { select: { id: true, fullName: true } } },
    orderBy: { employee: { fullName: "asc" } },
  });
  const members = memberships.map((m) => m.employee);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId: { in: members.map((m) => m.id) },
      date: { gte: startDate, lte: endDate },
    },
    select: { employeeId: true, date: true, checkIn: true },
  });
  const recordByKey = new Map(
    records.map((r) => [`${r.employeeId}_${r.date.toISOString().slice(0, 10)}`, r]),
  );

  const DAY_MS = 24 * 60 * 60 * 1000;
  const dayCount = Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;

  const points = Array.from({ length: dayCount }, (_, i) => {
    const date = new Date(startDate.getTime() + i * DAY_MS);
    const dateKey = date.toISOString().slice(0, 10);
    const byEmployee: Record<string, Date | null> = {};
    for (const member of members) {
      byEmployee[member.id] = recordByKey.get(`${member.id}_${dateKey}`)?.checkIn ?? null;
    }
    return { date, byEmployee };
  });

  return { members, points };
}
