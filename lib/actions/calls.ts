"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee, canManageLead } from "@/lib/auth";

export type StartCallState = { error: string | null; callId: string | null };

/**
 * A call session is a manually-tracked record of a real phone call made on
 * a physical line — not telephony integration. Idempotent: if an active
 * (unended) session already exists for this lead/caller, returns it instead
 * of creating a duplicate, which is what protects against double-clicks,
 * retries, and accidental resubmits.
 */
export async function startCallSession(leadId: string): Promise<StartCallState> {
  const employee = await requireEmployee();
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { ownerId: true, doNotCall: true },
  });
  if (!lead) {
    return { error: "Lead not found.", callId: null };
  }
  if (!canManageLead(employee, lead)) {
    return { error: "Forbidden: you can't call this lead.", callId: null };
  }
  // Enforced here, not just hidden in the UI — a do-not-call lead can't be
  // dialed through this workflow at all.
  if (lead.doNotCall) {
    return { error: "This lead is marked do-not-call.", callId: null };
  }

  const existing = await prisma.callAttempt.findFirst({
    where: { leadId, callerId: employee.id, endedAt: null },
  });
  if (existing) {
    return { error: null, callId: existing.id };
  }

  const priorAttempts = await prisma.callAttempt.count({ where: { leadId } });

  const call = await prisma.callAttempt.create({
    data: {
      leadId,
      callerId: employee.id,
      attemptNumber: priorAttempts + 1,
      startedAt: new Date(),
    },
  });

  revalidatePath(`/leads/${leadId}`);
  return { error: null, callId: call.id };
}

/**
 * Escape hatch for a misclicked "Start call" — only deletable while still
 * unended and only by the caller who started it, so a real (ended) call
 * record can never be removed this way.
 */
export async function cancelCallSession(callId: string) {
  const employee = await requireEmployee();
  const call = await prisma.callAttempt.findUnique({
    where: { id: callId },
    select: { callerId: true, leadId: true, endedAt: true },
  });
  if (!call || call.callerId !== employee.id || call.endedAt) {
    return;
  }
  await prisma.callAttempt.delete({ where: { id: callId } });
  revalidatePath(`/leads/${call.leadId}`);
}

const outcomeSchema = z.enum([
  "NO_ANSWER",
  "BUSY",
  "VOICEMAIL",
  "GATEKEEPER",
  "DECISION_MAKER_REACHED",
  "INTERESTED",
  "CALLBACK_REQUESTED",
  "MEETING_BOOKED",
  "NOT_INTERESTED",
  "INVALID_NUMBER",
  "DO_NOT_CALL",
]);

const endCallSchema = z.object({
  outcome: outcomeSchema,
  decisionMakerReached: z.boolean().optional(),
  interestLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  painPoints: z.string().max(2000).optional(),
  objections: z.string().max(2000).optional(),
  notes: z.string().max(4000).optional(),
  nextAction: z.string().max(500).optional(),
  nextFollowUpDate: z.string().optional(),
  meetingDetails: z.string().max(2000).optional(),
  whatsappConsent: z.enum(["true", "false"]).optional(),
});

export type EndCallState = { error: string | null };

/**
 * Persists the final details of an in-progress session. Duration and
 * endedAt are both computed here from the server clock, not trusted from
 * the client — there's no backdating concern for a call session the way
 * there is for attendance, so there's no need for the client-resolved-ISO
 * pattern used elsewhere in this app.
 */
export async function endCallSession(
  callId: string,
  _prevState: EndCallState,
  formData: FormData,
): Promise<EndCallState> {
  const employee = await requireEmployee();

  const call = await prisma.callAttempt.findUnique({
    where: { id: callId },
    select: {
      callerId: true,
      leadId: true,
      startedAt: true,
      endedAt: true,
      lead: { select: { ownerId: true } },
    },
  });
  if (!call) {
    return { error: "Call session not found." };
  }
  if (call.callerId !== employee.id) {
    // No admin override — an admin wasn't on the call and can't report
    // what happened on it.
    return { error: "Forbidden: only the caller who started this session can end it." };
  }
  if (call.endedAt) {
    // Already ended — a duplicate submit (double-click, retry after a
    // network blip) is a no-op success, not an error.
    return { error: null };
  }

  const parsed = endCallSchema.safeParse({
    outcome: formData.get("outcome"),
    decisionMakerReached: formData.get("decisionMakerReached") === "true",
    interestLevel: formData.get("interestLevel") || undefined,
    painPoints: formData.get("painPoints") || undefined,
    objections: formData.get("objections") || undefined,
    notes: formData.get("notes") || undefined,
    nextAction: formData.get("nextAction") || undefined,
    nextFollowUpDate: formData.get("nextFollowUpDate") || undefined,
    meetingDetails: formData.get("meetingDetails") || undefined,
    whatsappConsent: formData.get("whatsappConsent") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }
  const data = parsed.data;

  const endedAt = new Date();
  const durationSeconds = Math.max(
    0,
    Math.round((endedAt.getTime() - call.startedAt.getTime()) / 1000),
  );
  const nextFollowUpDate = data.nextFollowUpDate
    ? new Date(`${data.nextFollowUpDate}T00:00:00.000Z`)
    : null;
  // The prospect telling the caller to stop calling is discovered during
  // the call itself — enforce it immediately rather than waiting for a
  // separate action, same principle as the server-side check in
  // startCallSession.
  const triggersDoNotCall = data.outcome === "DO_NOT_CALL";

  await prisma.$transaction([
    prisma.callAttempt.update({
      where: { id: callId },
      data: {
        endedAt,
        durationSeconds,
        outcome: data.outcome,
        decisionMakerReached: data.decisionMakerReached ?? false,
        interestLevel: data.interestLevel || null,
        painPoints: data.painPoints || null,
        objections: data.objections || null,
        notes: data.notes || null,
        nextAction: data.nextAction || null,
        nextFollowUpDate,
        meetingDetails: data.meetingDetails || null,
        whatsappConsent:
          data.whatsappConsent === undefined ? null : data.whatsappConsent === "true",
      },
    }),
    prisma.lead.update({
      where: { id: call.leadId },
      data: {
        ...(nextFollowUpDate ? { nextFollowUpDate } : {}),
        ...(data.nextAction ? { nextAction: data.nextAction } : {}),
        ...(triggersDoNotCall
          ? { doNotCall: true, doNotCallReason: "Requested during a call" }
          : {}),
      },
    }),
    ...(nextFollowUpDate
      ? [
          prisma.followUp.create({
            data: {
              leadId: call.leadId,
              callAttemptId: callId,
              dueDate: nextFollowUpDate,
              action: data.nextAction || "Follow up",
              assignedToId: call.lead.ownerId ?? employee.id,
            },
          }),
        ]
      : []),
  ]);

  revalidatePath("/leads");
  revalidatePath(`/leads/${call.leadId}`);
  return { error: null };
}
