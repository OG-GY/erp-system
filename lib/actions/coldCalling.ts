"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee, isCallCaller, canManageColdLead } from "@/lib/auth";
import {
  CALL_OUTCOMES,
  CLOSED_COLD_STATUSES,
  COLD_SOURCE_LABEL,
  COLD_STATUS_LABEL,
  OUTCOMES_REQUIRING_FOLLOW_UP,
  normalizePhone,
  parsePktDateTime,
  phoneVariants,
} from "@/lib/coldCalling";

const coldLeadFieldsSchema = z.object({
  businessName: z.string().trim().min(1, "Enter the business name.").max(200),
  phone: z
    .string()
    .max(50)
    .transform(normalizePhone)
    .refine((v) => v.replace("+", "").length >= 7, "Enter a valid phone number."),
  whatsapp: z.string().max(50).optional(),
  category: z.string().max(200).optional(),
  city: z.string().max(200).optional(),
  area: z.string().max(200).optional(),
  contactName: z.string().max(200).optional(),
  source: z.enum(["GOOGLE_MAPS", "REFERENCE", "SOCIAL_MEDIA", "WALK_IN", "OTHER"]),
  sourceDetail: z.string().max(500).optional(),
  notes: z.string().max(4000).optional(),
});

function parseColdLeadFields(formData: FormData) {
  return coldLeadFieldsSchema.safeParse({
    businessName: formData.get("businessName") ?? "",
    phone: formData.get("phone") ?? "",
    whatsapp: formData.get("whatsapp") || undefined,
    category: formData.get("category") || undefined,
    city: formData.get("city") || undefined,
    area: formData.get("area") || undefined,
    contactName: formData.get("contactName") || undefined,
    source: formData.get("source") || "GOOGLE_MAPS",
    sourceDetail: formData.get("sourceDetail") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

function coldLeadWriteData(data: z.infer<typeof coldLeadFieldsSchema>) {
  return {
    businessName: data.businessName,
    phone: data.phone,
    whatsapp: data.whatsapp ? normalizePhone(data.whatsapp) : null,
    category: data.category || null,
    city: data.city || null,
    area: data.area || null,
    contactName: data.contactName || null,
    source: data.source,
    sourceDetail: data.sourceDetail || null,
    notes: data.notes || null,
  };
}

export type ColdDuplicate = {
  id: string;
  businessName: string;
  where: "cold" | "leads";
  addedBy: string | null;
};
export type ColdLeadFormState = {
  error: string | null;
  success?: boolean;
  duplicates?: ColdDuplicate[];
  businessName?: string;
};

/**
 * Soft duplicate check on the phone number, across both cold leads (anyone's)
 * and the main Leads pipeline — the whole point is not calling the same
 * business twice. The form re-submits with confirmDuplicate=true to proceed.
 */
export async function createColdLead(
  _prevState: ColdLeadFormState,
  formData: FormData,
): Promise<ColdLeadFormState> {
  const employee = await requireEmployee();

  const parsed = parseColdLeadFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }
  const data = parsed.data;

  if (formData.get("confirmDuplicate") !== "true") {
    const variants = phoneVariants(data.phone);
    const [coldMatches, leadMatches] = await Promise.all([
      prisma.coldLead.findMany({
        where: { phone: { in: variants } },
        select: { id: true, businessName: true, owner: { select: { fullName: true } } },
        take: 3,
      }),
      prisma.lead.findMany({
        where: { OR: [{ phone: { in: variants } }, { whatsapp: { in: variants } }] },
        select: { id: true, businessName: true },
        take: 3,
      }),
    ]);
    const duplicates: ColdDuplicate[] = [
      ...coldMatches.map((m) => ({
        id: m.id,
        businessName: m.businessName,
        where: "cold" as const,
        addedBy: m.owner.fullName,
      })),
      ...leadMatches.map((m) => ({ id: m.id, businessName: m.businessName, where: "leads" as const, addedBy: null })),
    ];
    if (duplicates.length > 0) {
      return { error: null, duplicates };
    }
  }

  await prisma.coldLead.create({
    data: { ...coldLeadWriteData(data), ownerId: employee.id },
  });

  revalidatePath("/cold-calling");
  return { error: null, success: true, businessName: data.businessName };
}

export async function updateColdLead(
  coldLeadId: string,
  _prevState: ColdLeadFormState,
  formData: FormData,
): Promise<ColdLeadFormState> {
  const employee = await requireEmployee();
  const coldLead = await prisma.coldLead.findUnique({ where: { id: coldLeadId }, select: { ownerId: true } });
  if (!coldLead) return { error: "Business not found.", success: false };
  if (!canManageColdLead(employee, coldLead)) {
    return { error: "Forbidden: you can't edit this business.", success: false };
  }

  const parsed = parseColdLeadFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields.", success: false };
  }

  await prisma.coldLead.update({ where: { id: coldLeadId }, data: coldLeadWriteData(parsed.data) });

  revalidatePath("/cold-calling");
  revalidatePath(`/cold-calling/${coldLeadId}`);
  return { error: null, success: true };
}

// DETAILS_SENT isn't a call outcome, but it's logged through the same form
// so it lands on the timeline (only offered while the lead is SEND_DETAILS).
const logOutcomeSchema = z.enum([...CALL_OUTCOMES, "DETAILS_SENT"]);

export type LogColdCallState = { error: string | null; success: boolean };

/**
 * The outcome becomes the lead's new status — that's the whole funnel. A
 * callback / reach-out-later must say when, so it reappears in the Due queue
 * on time; closed outcomes clear any pending follow-up.
 */
export async function logColdCall(
  coldLeadId: string,
  _prevState: LogColdCallState,
  formData: FormData,
): Promise<LogColdCallState> {
  const employee = await requireEmployee();
  const coldLead = await prisma.coldLead.findUnique({
    where: { id: coldLeadId },
    select: { ownerId: true, status: true },
  });
  if (!coldLead) return { error: "Business not found.", success: false };
  if (!canManageColdLead(employee, coldLead)) {
    return { error: "Forbidden: you can't log calls for this business.", success: false };
  }
  if (coldLead.status === "CONVERTED") {
    return { error: "This business was already moved to Leads — log further calls there.", success: false };
  }

  const parsedOutcome = logOutcomeSchema.safeParse(formData.get("outcome"));
  if (!parsedOutcome.success) return { error: "Pick what happened on the call.", success: false };
  const outcome = parsedOutcome.data;

  const notesRaw = formData.get("notes");
  const notes = typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim().slice(0, 4000) : null;

  const followUpRaw = formData.get("followUpAt");
  let followUpAt: Date | null = null;
  if (!CLOSED_COLD_STATUSES.includes(outcome) && typeof followUpRaw === "string" && followUpRaw) {
    followUpAt = parsePktDateTime(followUpRaw);
    if (!followUpAt) return { error: "Enter a valid follow-up date and time.", success: false };
  }
  if (OUTCOMES_REQUIRING_FOLLOW_UP.includes(outcome) && !followUpAt) {
    return {
      error: `Set when to ${outcome === "CALLBACK" ? "call back" : "reach out again"}.`,
      success: false,
    };
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.coldCallLog.create({
      data: { coldLeadId, callerId: employee.id, outcome, notes, followUpAt },
    }),
    prisma.coldLead.update({
      where: { id: coldLeadId },
      data: {
        status: outcome,
        followUpAt,
        ...(outcome === "DETAILS_SENT" ? {} : { lastCalledAt: now }),
      },
    }),
  ]);

  revalidatePath("/cold-calling");
  revalidatePath(`/cold-calling/${coldLeadId}`);
  return { error: null, success: true };
}

/**
 * Promotes an interested cold lead into the main Leads pipeline, carrying
 * its notes and call timeline over as the new Lead's notes. Owned by the
 * person converting it if they're a caller, otherwise it lands in the
 * unowned pool for the callers to pick up.
 */
export async function convertColdLead(coldLeadId: string): Promise<{ error: string | null }> {
  const employee = await requireEmployee();
  const coldLead = await prisma.coldLead.findUnique({
    where: { id: coldLeadId },
    include: {
      logs: { orderBy: { createdAt: "asc" }, include: { caller: { select: { fullName: true } } } },
    },
  });
  if (!coldLead) return { error: "Business not found." };
  if (!canManageColdLead(employee, coldLead)) {
    return { error: "Forbidden: you can't move this business." };
  }
  if (coldLead.status === "CONVERTED") return { error: "Already moved to Leads." };

  const timeline = coldLead.logs.map((log) => {
    const when = log.createdAt.toISOString().slice(0, 10);
    const line = `${when} · ${COLD_STATUS_LABEL[log.outcome]} (${log.caller.fullName})`;
    return log.notes ? `${line}: ${log.notes}` : line;
  });
  const notes = [coldLead.notes, timeline.length ? `Cold-call history:\n${timeline.join("\n")}` : null]
    .filter(Boolean)
    .join("\n\n");
  const source = coldLead.sourceDetail
    ? `Cold call — ${COLD_SOURCE_LABEL[coldLead.source]} (${coldLead.sourceDetail})`
    : `Cold call — ${COLD_SOURCE_LABEL[coldLead.source]}`;

  await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        businessName: coldLead.businessName,
        industry: coldLead.category,
        city: coldLead.city,
        area: coldLead.area,
        contactName: coldLead.contactName,
        phone: coldLead.phone,
        whatsapp: coldLead.whatsapp,
        source: source.slice(0, 200),
        notes: notes.slice(0, 4000) || null,
        status: "CONTACTED",
        createdById: employee.id,
        ownerId: isCallCaller(employee.role) ? employee.id : null,
      },
      select: { id: true },
    });
    await tx.leadStatusEvent.create({
      data: { leadId: lead.id, fromStatus: null, toStatus: "CONTACTED", changedById: employee.id },
    });
    await tx.coldLead.update({
      where: { id: coldLeadId },
      data: { status: "CONVERTED", followUpAt: null, convertedLeadId: lead.id },
    });
  });

  revalidatePath("/cold-calling");
  revalidatePath(`/cold-calling/${coldLeadId}`);
  revalidatePath("/leads");
  return { error: null };
}

export async function deleteColdLead(coldLeadId: string): Promise<{ error: string | null }> {
  const employee = await requireEmployee();
  const coldLead = await prisma.coldLead.findUnique({ where: { id: coldLeadId }, select: { ownerId: true } });
  if (!coldLead) return { error: "Business not found." };
  if (!canManageColdLead(employee, coldLead)) {
    return { error: "Forbidden: you can't delete this business." };
  }

  // ColdCallLog rows go with it (onDelete: Cascade).
  await prisma.coldLead.delete({ where: { id: coldLeadId } });

  revalidatePath("/cold-calling");
  return { error: null };
}
