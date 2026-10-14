"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployee, isAdmin, isCallCaller } from "@/lib/auth";

const MAX_ROWS = 1000;

const importRowSchema = z.object({
  businessName: z.string().min(1, "Business name is required.").max(200),
  industry: z.string().max(200).optional(),
  city: z.string().max(200).optional(),
  area: z.string().max(200).optional(),
  contactName: z.string().max(200).optional(),
  contactRole: z.string().max(200).optional(),
  // Deliberately looser than the single-lead-create form (no email format
  // check, no length-specific phone format) — a bulk import shouldn't fail
  // a whole row over a formatting quirk in someone else's spreadsheet.
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  email: z.string().max(200).optional(),
  website: z.string().max(300).optional(),
  source: z.string().max(200).optional(),
  notes: z.string().max(4000).optional(),
  onlinePresence: z.string().max(2000).optional(),
  identifiedNeeds: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export type ImportLeadRow = z.infer<typeof importRowSchema>;

export type ImportLeadsResult = {
  error: string | null;
  created: number;
  skippedDuplicates: { row: number; businessName: string; existingLeadId: string | null }[];
  invalidRows: { row: number; reason: string }[];
};

/**
 * Bulk lead creation from the CSV import wizard. Rows arrive already mapped
 * and defaulted client-side (lib/csv.ts just parses text into cells — the
 * mapping UI is what turns a cell into a named field) — this only validates
 * and persists them.
 *
 * Duplicate handling is a batch-appropriate adaptation of the same
 * phone/website/business-name check used by the single-lead create form:
 * instead of a per-row confirmation prompt (impractical at this scale),
 * matches are skipped and reported in the result for review, same as
 * duplicates found within the file itself.
 */
export async function importLeads(
  rows: unknown[],
  options: { ownerId?: string | null },
): Promise<ImportLeadsResult> {
  const employee = await requireEmployee();
  if (!isAdmin(employee.role) && !isCallCaller(employee.role)) {
    return { error: "Forbidden.", created: 0, skippedDuplicates: [], invalidRows: [] };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "No rows to import.", created: 0, skippedDuplicates: [], invalidRows: [] };
  }
  if (rows.length > MAX_ROWS) {
    return {
      error: `Too many rows — import at most ${MAX_ROWS} at a time.`,
      created: 0,
      skippedDuplicates: [],
      invalidRows: [],
    };
  }

  // A caller importing always owns the leads they bring in — only an admin
  // can hand a batch to someone else.
  let ownerId: string | null = isCallCaller(employee.role) ? employee.id : null;
  if (isAdmin(employee.role) && options.ownerId) {
    const owner = await prisma.employee.findUnique({
      where: { id: options.ownerId },
      select: { id: true },
    });
    if (!owner) {
      return { error: "Selected owner no longer exists.", created: 0, skippedDuplicates: [], invalidRows: [] };
    }
    ownerId = owner.id;
  }

  const invalidRows: ImportLeadsResult["invalidRows"] = [];
  const validRows: ImportLeadRow[] = [];
  rows.forEach((raw, i) => {
    const parsed = importRowSchema.safeParse(raw);
    if (!parsed.success) {
      invalidRows.push({ row: i + 1, reason: parsed.error.issues[0]?.message ?? "Invalid row." });
      return;
    }
    validRows.push(parsed.data);
  });

  if (validRows.length === 0) {
    return { error: null, created: 0, skippedDuplicates: [], invalidRows };
  }

  // One query covering every candidate in the batch, not one per row.
  const phones = validRows.map((r) => r.phone).filter((v): v is string => !!v);
  const websites = validRows.map((r) => r.website).filter((v): v is string => !!v);
  const businessNames = validRows.map((r) => r.businessName);

  const existing = await prisma.lead.findMany({
    where: {
      OR: [
        ...(phones.length ? [{ phone: { in: phones } }] : []),
        ...(websites.length ? [{ website: { in: websites } }] : []),
        { businessName: { in: businessNames, mode: "insensitive" as const } },
      ],
    },
    select: { id: true, businessName: true, phone: true, website: true },
  });
  const existingByName = new Map(existing.map((e) => [e.businessName.toLowerCase(), e]));
  const existingByPhone = new Map(existing.filter((e) => e.phone).map((e) => [e.phone as string, e]));
  const existingByWebsite = new Map(existing.filter((e) => e.website).map((e) => [e.website as string, e]));

  const skippedDuplicates: ImportLeadsResult["skippedDuplicates"] = [];
  const toCreate: ImportLeadRow[] = [];
  const seenInBatch = new Set<string>();

  validRows.forEach((row, idx) => {
    const nameKey = row.businessName.toLowerCase();
    const match =
      (row.phone && existingByPhone.get(row.phone)) ||
      (row.website && existingByWebsite.get(row.website)) ||
      existingByName.get(nameKey);

    if (match) {
      skippedDuplicates.push({ row: idx + 1, businessName: row.businessName, existingLeadId: match.id });
      return;
    }
    if (seenInBatch.has(nameKey)) {
      skippedDuplicates.push({ row: idx + 1, businessName: row.businessName, existingLeadId: null });
      return;
    }
    seenInBatch.add(nameKey);
    toCreate.push(row);
  });

  let created = 0;
  if (toCreate.length > 0) {
    // Not wrapped with the status-event inserts in one $transaction: this
    // app's DATABASE_URL uses Supabase's transaction-mode pooler, which
    // doesn't support the interactive transaction form a dependent
    // multi-step write like this would need — createManyAndReturn's ids
    // aren't known until it resolves. Worst case on a crash between the two
    // calls is a lead missing its initial history event, not a corrupt or
    // partially-written lead.
    const createdLeads = await prisma.lead.createManyAndReturn({
      data: toCreate.map((row) => ({
        businessName: row.businessName,
        industry: row.industry || null,
        city: row.city || null,
        area: row.area || null,
        contactName: row.contactName || null,
        contactRole: row.contactRole || null,
        phone: row.phone || null,
        whatsapp: row.whatsapp || null,
        email: row.email || null,
        website: row.website || null,
        source: row.source || null,
        notes: row.notes || null,
        onlinePresence: row.onlinePresence || null,
        identifiedNeeds: row.identifiedNeeds || null,
        priority: row.priority || null,
        createdById: employee.id,
        ownerId,
      })),
      select: { id: true },
    });

    await prisma.leadStatusEvent.createMany({
      data: createdLeads.map((lead) => ({
        leadId: lead.id,
        fromStatus: null,
        toStatus: "NEW" as const,
        changedById: employee.id,
      })),
    });

    created = createdLeads.length;
  }

  revalidatePath("/leads");
  return { error: null, created, skippedDuplicates, invalidRows };
}
