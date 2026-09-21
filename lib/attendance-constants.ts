/**
 * Hours since check-in after which a still-open shift is auto-closed.
 * No server-only imports here (unlike lib/attendance.ts) — this needs to be
 * safely importable from the client-side timer in CheckInCard too.
 */
export const AUTO_CHECKOUT_HOURS = 12;
