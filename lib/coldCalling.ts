import type { ColdLeadSource, ColdLeadStatus } from "@prisma/client";

// Shared by the cold-calling pages, forms and Server Actions — no server-only
// imports, so Client Components can use the labels too.

export const COLD_STATUS_LABEL: Record<ColdLeadStatus, string> = {
  NEW: "To call",
  NO_ANSWER: "No answer",
  CALLBACK: "Call back",
  SEND_DETAILS: "Send WhatsApp details",
  DETAILS_SENT: "Details sent",
  FOLLOW_UP_LATER: "Reach out later",
  INTERESTED: "Interested",
  CONVERTED: "Moved to Leads",
  HAS_TEAM: "Already has a team",
  NOT_INTERESTED: "Not interested",
  WRONG_NUMBER: "Wrong number",
};

export const COLD_STATUS_TONE: Record<ColdLeadStatus, "neutral" | "success" | "warning" | "danger"> = {
  NEW: "neutral",
  NO_ANSWER: "neutral",
  CALLBACK: "warning",
  SEND_DETAILS: "warning",
  DETAILS_SENT: "warning",
  FOLLOW_UP_LATER: "warning",
  INTERESTED: "success",
  CONVERTED: "success",
  HAS_TEAM: "danger",
  NOT_INTERESTED: "danger",
  WRONG_NUMBER: "danger",
};

/** Funnel order — what the status chips on /cold-calling are listed in. */
export const COLD_STATUS_ORDER: ColdLeadStatus[] = [
  "NEW",
  "NO_ANSWER",
  "CALLBACK",
  "SEND_DETAILS",
  "DETAILS_SENT",
  "FOLLOW_UP_LATER",
  "INTERESTED",
  "CONVERTED",
  "HAS_TEAM",
  "NOT_INTERESTED",
  "WRONG_NUMBER",
];

/** Dead ends — never show up in the "Due" queue. */
export const CLOSED_COLD_STATUSES: ColdLeadStatus[] = [
  "CONVERTED",
  "HAS_TEAM",
  "NOT_INTERESTED",
  "WRONG_NUMBER",
];

/** What a call can end in, in the order the log-call buttons show. */
export const CALL_OUTCOMES = [
  "NO_ANSWER",
  "CALLBACK",
  "SEND_DETAILS",
  "FOLLOW_UP_LATER",
  "INTERESTED",
  "HAS_TEAM",
  "NOT_INTERESTED",
  "WRONG_NUMBER",
] as const satisfies readonly ColdLeadStatus[];

/** Outcomes that are meaningless without a "when" — enforced server-side. */
export const OUTCOMES_REQUIRING_FOLLOW_UP: ColdLeadStatus[] = ["CALLBACK", "FOLLOW_UP_LATER"];

export const COLD_SOURCE_LABEL: Record<ColdLeadSource, string> = {
  GOOGLE_MAPS: "Google Maps",
  REFERENCE: "Reference",
  SOCIAL_MEDIA: "Social media",
  WALK_IN: "Walk-in / in person",
  OTHER: "Other",
};

/** Digits plus an optional leading "+" — "0300-123 4567" and "03001234567" match. */
export function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

/** The same Pakistani number written locally (03xx) or internationally (+92 3xx) — for duplicate checks. */
export function phoneVariants(normalized: string) {
  const digits = normalized.replace("+", "");
  const local = digits.startsWith("92") ? `0${digits.slice(2)}` : digits;
  const international = local.startsWith("0") ? `+92${local.slice(1)}` : normalized;
  return [...new Set([normalized, local, international, international.replace("+", "")])];
}

/** wa.me wants the full international number without "+"; assumes Pakistan (92) for local 03xx numbers. */
export function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

// The business timezone (see lib/format.ts) has no DST, so a fixed offset is
// exact — a <input type="datetime-local"> value is always read as PKT,
// whichever timezone the server runs in.
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Parses a datetime-local value ("2026-10-28T16:00") as Pakistan time. */
export function parsePktDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Inverse of parsePktDateTime — a Date as a datetime-local value in PKT. */
export function toPktInputValue(date: Date) {
  return new Date(date.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 16);
}

/** The instant today ends in PKT — everything with a follow-up before it is due. */
export function endOfTodayPkt(now = new Date()) {
  const pktDay = new Date(now.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 10);
  return new Date(new Date(`${pktDay}T00:00:00+05:00`).getTime() + 86_400_000);
}

/** Start of today in PKT. */
export function startOfTodayPkt(now = new Date()) {
  return new Date(endOfTodayPkt(now).getTime() - 86_400_000);
}
