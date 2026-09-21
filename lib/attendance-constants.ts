/**
 * Minutes since check-in after which a still-open shift is auto-closed.
 * No server-only imports here (unlike lib/attendance.ts) — this needs to be
 * safely importable from the client-side timer in CheckInCard too, so the
 * override must be a NEXT_PUBLIC_ var (the only kind Next.js inlines into
 * the browser bundle) rather than a plain server-side env var.
 *
 * Overridable via NEXT_PUBLIC_AUTO_CHECKOUT_MINUTES for local testing —
 * unset in production, so it defaults to the real 12h limit there.
 */
const DEFAULT_MINUTES = 12 * 60;

const configuredMinutes = Number(process.env.NEXT_PUBLIC_AUTO_CHECKOUT_MINUTES);

export const AUTO_CHECKOUT_MINUTES =
  Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : DEFAULT_MINUTES;

export const AUTO_CHECKOUT_MS = AUTO_CHECKOUT_MINUTES * 60 * 1000;
