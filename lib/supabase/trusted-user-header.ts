/**
 * Header the proxy sets on the request after it has already verified the
 * session with Supabase Auth (a real network round-trip). Server Components
 * trust this instead of re-verifying, saving a second round-trip per page
 * load. Safe because every page request passes through the proxy first (see
 * its matcher) — the proxy always overwrites this header itself, so a
 * client can't forge it by sending it directly.
 */
export const TRUSTED_USER_ID_HEADER = "x-verified-user-id";
