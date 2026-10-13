"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireEmployee,
  requireAdmin,
  isAdmin,
  isCallCaller,
  canManageLead,
} from "@/lib/auth";

const leadFieldsSchema = z.object({
  businessName: z.string().min(1, "Enter a business name.").max(200),
  industry: z.string().max(200).optional(),
  city: z.string().max(200).optional(),
  area: z.string().max(200).optional(),
  contactName: z.string().max(200).optional(),
  contactRole: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  email: z.string().email("Enter a valid email.").max(200).optional().or(z.literal("")),
  website: z.string().max(300).optional(),
  source: z.string().max(200).optional(),
  notes: z.string().max(4000).optional(),
  onlinePresence: z.string().max(2000).optional(),
  identifiedNeeds: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

function parseLeadFields(formData: FormData) {
  return leadFieldsSchema.safeParse({
    businessName: formData.get("businessName"),
    industry: formData.get("industry") || undefined,
    city: formData.get("city") || undefined,
    area: formData.get("area") || undefined,
    contactName: formData.get("contactName") || undefined,
    contactRole: formData.get("contactRole") || undefined,
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || undefined,
    website: formData.get("website") || undefined,
    source: formData.get("source") || undefined,
    notes: formData.get("notes") || undefined,
    onlinePresence: formData.get("onlinePresence") || undefined,
    identifiedNeeds: formData.get("identifiedNeeds") || undefined,
    priority: formData.get("priority") || undefined,
  });
}

function leadWriteData(data: z.infer<typeof leadFieldsSchema>) {
  return {
    businessName: data.businessName,
    industry: data.industry || null,
    city: data.city || null,
    area: data.area || null,
    contactName: data.contactName || null,
    contactRole: data.contactRole || null,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    email: data.email || null,
    website: data.website || null,
    source: data.source || null,
    notes: data.notes || null,
    onlinePresence: data.onlinePresence || null,
    identifiedNeeds: data.identifiedNeeds || null,
    priority: data.priority || null,
  };
}

export type DuplicateMatch = { id: string; businessName: string; phone: string | null };
export type CreateLeadState = {
  error: string | null;
  duplicates?: DuplicateMatch[];
};

/**
 * Soft duplicate check: if a lead with the same phone, website, or business
 * name already exists, the first submit comes back with the matches instead
 * of creating anything — the form re-submits with confirmDuplicate=true to
 * proceed anyway. Never silently rejects a legitimate second business.
 */
export async function createLead(
  _prevState: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
  const employee = await requireEmployee();
  if (!isAdmin(employee.role) && !isCallCaller(employee.role)) {
    redirect("/dashboard");
  }

  const parsed = parseLeadFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }
  const data = parsed.data;
  const confirmDuplicate = formData.get("confirmDuplicate") === "true";

  if (!confirmDuplicate) {
    const orConditions: Prisma.LeadWhereInput[] = [
      { businessName: { equals: data.businessName, mode: "insensitive" } },
    ];
    if (data.phone) orConditions.push({ phone: data.phone });
    if (data.website) orConditions.push({ website: data.website });

    const duplicates = await prisma.lead.findMany({
      where: { OR: orConditions },
      select: { id: true, businessName: true, phone: true },
      take: 5,
    });
    if (duplicates.length > 0) {
      return { error: null, duplicates };
    }
  }

  const lead = await prisma.lead.create({
    data: {
      ...leadWriteData(data),
      createdById: employee.id,
      ownerId: isCallCaller(employee.role) ? employee.id : null,
    },
  });

  await prisma.leadStatusEvent.create({
    data: { leadId: lead.id, fromStatus: null, toStatus: "NEW", changedById: employee.id },
  });

  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export type UpdateLeadState = { error: string | null; success: boolean };

export async function updateLead(
  leadId: string,
  _prevState: UpdateLeadState,
  formData: FormData,
): Promise<UpdateLeadState> {
  const employee = await requireEmployee();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true } });
  if (!lead) {
    return { error: "Lead not found.", success: false };
  }
  if (!canManageLead(employee, lead)) {
    return { error: "Forbidden: you can't edit this lead.", success: false };
  }

  const parsed = parseLeadFields(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the fields.",
      success: false,
    };
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: leadWriteData(parsed.data),
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { error: null, success: true };
}

const statusSchema = z.enum([
  "NEW",
  "READY_TO_CALL",
  "CONTACTED",
  "QUALIFIED",
  "MEETING_BOOKED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
  "DISQUALIFIED",
]);

export type UpdateLeadStatusState = { error: string | null };

/**
 * A status change is always a deliberate, separate action — never a side
 * effect of logging a call (see lib/actions/calls.ts). Marking a lead
 * Won/Lost/Disqualified requires a reason, captured in the same event that
 * records the transition (LeadStatusEvent), so the pipeline history survives
 * independently of whatever Lead.status is overwritten to later.
 */
export async function updateLeadStatus(
  leadId: string,
  _prevState: UpdateLeadStatusState,
  formData: FormData,
): Promise<UpdateLeadStatusState> {
  const employee = await requireEmployee();
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { ownerId: true, status: true },
  });
  if (!lead) {
    return { error: "Lead not found." };
  }
  if (!canManageLead(employee, lead)) {
    return { error: "Forbidden: you can't update this lead." };
  }

  const parsedStatus = statusSchema.safeParse(formData.get("status"));
  if (!parsedStatus.success) {
    return { error: "Invalid status." };
  }
  const toStatus = parsedStatus.data;

  const reasonRaw = formData.get("reason");
  const reason = typeof reasonRaw === "string" && reasonRaw.trim() ? reasonRaw.trim() : null;
  if ((toStatus === "LOST" || toStatus === "DISQUALIFIED") && !reason) {
    return {
      error: `Enter a reason for marking this lead ${toStatus === "LOST" ? "lost" : "disqualified"}.`,
    };
  }

  let dealValue: number | null | undefined;
  if (toStatus === "WON") {
    const dealValueRaw = formData.get("dealValue");
    if (typeof dealValueRaw === "string" && dealValueRaw.trim()) {
      const parsedValue = Number(dealValueRaw);
      if (Number.isNaN(parsedValue) || parsedValue < 0) {
        return { error: "Enter a valid deal value." };
      }
      dealValue = parsedValue;
    }
  }

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        status: toStatus,
        lostReason: toStatus === "LOST" ? reason : undefined,
        disqualifiedReason: toStatus === "DISQUALIFIED" ? reason : undefined,
        ...(dealValue !== undefined ? { dealValue } : {}),
      },
    }),
    prisma.leadStatusEvent.create({
      data: { leadId, fromStatus: lead.status, toStatus, reason, changedById: employee.id },
    }),
  ]);

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { error: null };
}

export type SetDoNotCallState = { error: string | null };

export async function setLeadDoNotCall(
  leadId: string,
  doNotCall: boolean,
  reason: string | null,
): Promise<SetDoNotCallState> {
  const employee = await requireEmployee();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true } });
  if (!lead) {
    return { error: "Lead not found." };
  }
  if (!canManageLead(employee, lead)) {
    return { error: "Forbidden: you can't update this lead." };
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { doNotCall, doNotCallReason: doNotCall ? reason || null : null },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { error: null };
}

/** Admin-only: reassigns a lead to a different caller, or back to the unowned pool (ownerId null). */
export async function assignLeadOwner(leadId: string, ownerId: string | null) {
  await requireAdmin();
  await prisma.lead.update({ where: { id: leadId }, data: { ownerId } });
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

export type RequestHandoffState = { error: string | null };

export async function requestHandoff(
  leadId: string,
  _prevState: RequestHandoffState,
  formData: FormData,
): Promise<RequestHandoffState> {
  const employee = await requireEmployee();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true } });
  if (!lead) {
    return { error: "Lead not found." };
  }
  if (!canManageLead(employee, lead)) {
    return { error: "Forbidden: you can't request a handoff for this lead." };
  }

  const contextRaw = formData.get("handoffContext");
  const context = typeof contextRaw === "string" ? contextRaw.trim() : "";
  if (!context) {
    return { error: "Summarize the opportunity for the founder before requesting a handoff." };
  }

  const handoffToIdRaw = formData.get("handoffToId");

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      handoffStatus: "PENDING",
      handoffContext: context,
      handoffAt: new Date(),
      handoffToId: typeof handoffToIdRaw === "string" && handoffToIdRaw ? handoffToIdRaw : null,
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { error: null };
}

const handoffStatusSchema = z.enum(["PENDING", "SENT", "ACCEPTED", "COMPLETED"]);
const FOUNDER_ONLY_HANDOFF_STATUSES = new Set(["ACCEPTED", "COMPLETED"]);

/**
 * SENT is the caller confirming they've informed the founder; ACCEPTED and
 * COMPLETED are the founder's own acknowledgment and are admin-only, so a
 * handoff can never be silently marked complete by the person who merely
 * requested it.
 */
export async function updateHandoffStatus(leadId: string, status: string) {
  const employee = await requireEmployee();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true } });
  if (!lead) {
    throw new Error("Lead not found.");
  }

  const parsed = handoffStatusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error("Invalid handoff status.");
  }

  if (FOUNDER_ONLY_HANDOFF_STATUSES.has(parsed.data)) {
    if (!isAdmin(employee.role)) {
      throw new Error("Forbidden: only an admin can accept or complete a handoff.");
    }
  } else if (!canManageLead(employee, lead)) {
    throw new Error("Forbidden: you can't update this lead's handoff.");
  }

  await prisma.lead.update({ where: { id: leadId }, data: { handoffStatus: parsed.data } });
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

/** Admin/founder confirms a booked meeting actually happened — distinct from the handoff being "completed". */
export async function markMeetingHeld(leadId: string) {
  await requireAdmin();
  await prisma.lead.update({ where: { id: leadId }, data: { meetingHeldAt: new Date() } });
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}
