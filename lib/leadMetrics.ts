import { prisma } from "@/lib/prisma";

/**
 * Outcomes where the caller actually reached a person, as opposed to
 * NO_ANSWER/BUSY/VOICEMAIL/INVALID_NUMBER/DO_NOT_CALL where no conversation
 * happened. Used to distinguish "attempted" from "connected" — an attempt is
 * not necessarily a connected call.
 */
const CONNECTED_OUTCOMES = [
  "GATEKEEPER",
  "DECISION_MAKER_REACHED",
  "INTERESTED",
  "CALLBACK_REQUESTED",
  "MEETING_BOOKED",
  "NOT_INTERESTED",
] as const;

export type CallerMetrics = {
  leadsAdded: number;
  callsAttempted: number;
  callsConnected: number;
  decisionMakersReached: number;
  qualifiedLeads: number;
  meetingsBooked: number;
  meetingsHeld: number;
  followUpsDue: number;
  followUpsCompleted: number;
  proposalsSent: number;
  dealsWon: number;
  revenueWon: number;
};

/**
 * Every figure is a live query/aggregation over the actual records — no
 * redundant counters that could drift. Pipeline metrics (qualified, meeting
 * booked, proposal sent, won) come from LeadStatusEvent so a lead that was
 * later lost still counts for having been qualified/booked/etc. within the
 * range, rather than only reflecting the lead's current status.
 */
export async function getCallerMetrics(
  employeeId: string,
  startDate: Date,
  endDate: Date,
): Promise<CallerMetrics> {
  // startDate/endDate are calendar days (UTC midnight, see todayDateOnly), and
  // endDate is inclusive — so the range runs up to the start of the NEXT day.
  // A plain `lte: endDate` stopped at 00:00 of endDate and silently dropped
  // everything done "today" from timestamp columns like createdAt/startedAt.
  const endExclusive = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  const createdRange = { gte: startDate, lt: endExclusive };

  const [
    leadsAdded,
    callsAttempted,
    callsConnected,
    decisionMakersReached,
    qualifiedLeads,
    meetingsBooked,
    meetingsHeld,
    followUpsDue,
    followUpsCompleted,
    wonEvents,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdById: employeeId, createdAt: createdRange } }),
    prisma.callAttempt.count({ where: { callerId: employeeId, startedAt: createdRange } }),
    prisma.callAttempt.count({
      where: { callerId: employeeId, startedAt: createdRange, outcome: { in: [...CONNECTED_OUTCOMES] } },
    }),
    prisma.callAttempt.count({
      where: { callerId: employeeId, startedAt: createdRange, decisionMakerReached: true },
    }),
    prisma.leadStatusEvent.count({
      where: { changedById: employeeId, toStatus: "QUALIFIED", createdAt: createdRange },
    }),
    prisma.leadStatusEvent.count({
      where: { changedById: employeeId, toStatus: "MEETING_BOOKED", createdAt: createdRange },
    }),
    prisma.lead.count({ where: { ownerId: employeeId, meetingHeldAt: createdRange } }),
    prisma.followUp.count({
      where: { assignedToId: employeeId, status: "SCHEDULED", dueDate: createdRange },
    }),
    prisma.followUp.count({
      where: { assignedToId: employeeId, status: "COMPLETED", completedAt: createdRange },
    }),
    prisma.leadStatusEvent.findMany({
      where: { changedById: employeeId, toStatus: "WON", createdAt: createdRange },
      select: { leadId: true },
    }),
  ]);

  const proposalsSent = await prisma.leadStatusEvent.count({
    where: { changedById: employeeId, toStatus: "PROPOSAL_SENT", createdAt: createdRange },
  });

  const wonLeadIds = wonEvents.map((e) => e.leadId);
  const wonDealValues = wonLeadIds.length
    ? await prisma.lead.findMany({
        where: { id: { in: wonLeadIds } },
        select: { dealValue: true },
      })
    : [];
  const revenueWon = wonDealValues.reduce((sum, l) => sum + Number(l.dealValue ?? 0), 0);

  return {
    leadsAdded,
    callsAttempted,
    callsConnected,
    decisionMakersReached,
    qualifiedLeads,
    meetingsBooked,
    meetingsHeld,
    followUpsDue,
    followUpsCompleted,
    proposalsSent,
    dealsWon: wonEvents.length,
    revenueWon,
  };
}

export async function getAllCallerMetrics(startDate: Date, endDate: Date) {
  const callers = await prisma.employee.findMany({
    where: { role: "CALL_CALLER" },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
  });

  return Promise.all(
    callers.map(async (caller) => ({
      caller,
      metrics: await getCallerMetrics(caller.id, startDate, endDate),
    })),
  );
}
