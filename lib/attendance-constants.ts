/**
 * Minutes since check-in after which a still-open shift is auto-closed.
 * No server-only imports here (unlike lib/attendance.ts) — this needs to be
 * safely importable from the client-side timer in CheckInCard too.
 *
 * This used to be overridable via a NEXT_PUBLIC_AUTO_CHECKOUT_MINUTES env
 * var for local testing. Removed after that testing was done — leaving an
 * env-based override in place long-term is exactly the kind of thing that
 * can silently change production behavior (e.g. a stray value left set in
 * Vercel), so the limit is just a plain constant now.
 */
export const AUTO_CHECKOUT_MINUTES = 11 * 60;

export const AUTO_CHECKOUT_MS = AUTO_CHECKOUT_MINUTES * 60 * 1000;
