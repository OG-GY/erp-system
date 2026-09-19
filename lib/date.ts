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
