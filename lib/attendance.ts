import { prisma } from "@/lib/prisma";
import { AUTO_CHECKOUT_HOURS } from "@/lib/attendance-constants";

export { AUTO_CHECKOUT_HOURS };

const AUTO_CHECKOUT_STANDUP =
  "Auto checkout — reached the 12-hour limit without checking out.";

/**
 * The employee's in-progress shift, if any — checked in but not checked out
 * yet. Looked up by state (not by "today's" date) so a shift that started
 * before midnight and is still running after it (e.g. 11pm-4am) keeps
 * resolving to the record it started on. That record's `date` is fixed at
 * check-in time, so the whole shift stays attributed to the day it began.
 */
export function findOpenRecord(employeeId: string) {
  return prisma.attendanceRecord.findFirst({
    where: { employeeId, checkIn: { not: null }, checkOut: null },
    orderBy: { checkIn: "desc" },
    include: { breaks: { where: { endedAt: null } } },
  });
}

async function closeStaleRecord(record: {
  id: string;
  checkIn: Date;
  breaks: { id: string; startedAt: Date }[];
}) {
  const autoCheckOutTime = new Date(
    record.checkIn.getTime() + AUTO_CHECKOUT_HOURS * 60 * 60 * 1000,
  );

  await prisma.$transaction([
    prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { checkOut: autoCheckOutTime, standup: AUTO_CHECKOUT_STANDUP },
    }),
    // A break that started after the retroactive checkout time (possible if
    // this runs well past the 12h mark) would otherwise end up with endedAt
    // before startedAt.
    ...record.breaks.map((b) =>
      prisma.attendanceBreak.update({
        where: { id: b.id },
        data: {
          endedAt: new Date(
            Math.max(autoCheckOutTime.getTime(), b.startedAt.getTime()),
          ),
        },
      }),
    ),
  ]);
}

/**
 * Closes one employee's open shift if it's genuinely been 12h+ since
 * check-in. Meant to be triggered by a client-side timer reaching the 12h
 * mark, but never trusts that claim — re-reads checkIn from the database
 * and only acts if the server's own clock agrees, so a wrong or tampered
 * client clock can't force an early checkout. Returns whether it closed
 * anything.
 */
export async function autoCheckOutIfStale(employeeId: string) {
  const record = await findOpenRecord(employeeId);
  if (!record || !record.checkIn) return false;

  const cutoff = record.checkIn.getTime() + AUTO_CHECKOUT_HOURS * 60 * 60 * 1000;
  if (Date.now() < cutoff) return false;

  await closeStaleRecord({ ...record, checkIn: record.checkIn });
  return true;
}
