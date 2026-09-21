/**
 * Today's calendar date as a UTC-midnight Date, matching how Postgres `DATE`
 * columns (timezone-agnostic) round-trip through Prisma. Using
 * `new Date(); date.setHours(0,0,0,0)` instead would build LOCAL midnight —
 * on a server not running in UTC, that serializes to the wrong calendar day
 * once it hits a `@db.Date` column/comparison.
 */
export function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/**
 * Days until the next occurrence of a month/day (birth year ignored). `today`
 * must be a UTC-midnight Date, same as todayDateOnly() — this only compares
 * calendar dates, not times.
 */
export function daysUntilNextOccurrence(monthDay: Date, today: Date): number {
  const month = monthDay.getUTCMonth();
  const day = monthDay.getUTCDate();
  let next = new Date(Date.UTC(today.getUTCFullYear(), month, day));
  if (next.getTime() < today.getTime()) {
    next = new Date(Date.UTC(today.getUTCFullYear() + 1, month, day));
  }
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}
