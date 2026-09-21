import { prisma } from "@/lib/prisma";

export const AUTO_CHECKOUT_HOURS = 12;

const AUTO_CHECKOUT_STANDUP =
  "Auto checkout — reached the 12-hour limit without checking out.";

/**
 * Closes any shift still open 12+ hours after check-in (wall-clock time,
 * not worked time — a forgotten check-out is the target, not precise hour
 * tracking). checkOut is set to exactly checkIn + 12h rather than "now", so
 * recorded hours stay accurate regardless of how late this sweep runs.
 * Called from the /api/cron/auto-checkout route handler.
 */
export async function autoCheckOutStaleShifts() {
  const cutoff = new Date(Date.now() - AUTO_CHECKOUT_HOURS * 60 * 60 * 1000);

  const staleRecords = await prisma.attendanceRecord.findMany({
    where: { checkIn: { not: null, lte: cutoff }, checkOut: null },
    include: { breaks: { where: { endedAt: null } } },
  });

  for (const record of staleRecords) {
    const autoCheckOutTime = new Date(
      record.checkIn!.getTime() + AUTO_CHECKOUT_HOURS * 60 * 60 * 1000,
    );

    await prisma.$transaction([
      prisma.attendanceRecord.update({
        where: { id: record.id },
        data: { checkOut: autoCheckOutTime, standup: AUTO_CHECKOUT_STANDUP },
      }),
      // A break that started after the retroactive checkout time (possible
      // if this sweep runs well past the 12h mark) would otherwise end up
      // with endedAt before startedAt.
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

  return staleRecords.length;
}
