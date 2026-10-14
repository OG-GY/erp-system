export const MAX_IMPORT_ROWS = 1000;

export const LEAD_IMPORT_FIELDS = [
  {
    key: "businessName",
    label: "Business name",
    required: true,
    aliases: ["business", "businessname", "business name", "company", "companyname", "company name", "name"],
  },
  { key: "industry", label: "Industry", aliases: ["industry", "category", "sector"] },
  { key: "city", label: "City", aliases: ["city"] },
  { key: "area", label: "Area", aliases: ["area", "location", "neighborhood"] },
  {
    key: "businessOwnerName",
    label: "Business owner name",
    aliases: ["owner", "ownername", "owner name", "businessowner", "business owner", "businessownername", "proprietor", "proprietorname"],
  },
  {
    key: "contactName",
    label: "Contact person",
    aliases: ["contact", "contactname", "contact name", "contactperson", "contact person", "person"],
  },
  { key: "contactRole", label: "Contact's role", aliases: ["role", "contactrole", "designation", "title", "position"] },
  {
    key: "phone",
    label: "Phone",
    aliases: ["phone", "phonenumber", "phone number", "mobile", "cell", "contactnumber", "contact number"],
  },
  { key: "whatsapp", label: "WhatsApp", aliases: ["whatsapp", "whatsapp number", "whatsappnumber"] },
  { key: "email", label: "Email", aliases: ["email", "emailaddress", "email address"] },
  { key: "website", label: "Website", aliases: ["website", "url", "site", "web"] },
  { key: "source", label: "Source", aliases: ["source", "leadsource", "lead source"] },
  { key: "notes", label: "Notes", aliases: ["notes", "note", "comment", "comments"] },
  {
    key: "onlinePresence",
    label: "Online presence",
    aliases: ["onlinepresence", "online presence", "socialmedia", "social media", "presence"],
  },
  { key: "identifiedNeeds", label: "Identified needs", aliases: ["needs", "painpoints", "pain points", "problems"] },
  { key: "priority", label: "Priority (Low / Medium / High)", aliases: ["priority", "fit"] },
] as const;

export type LeadImportFieldKey = (typeof LEAD_IMPORT_FIELDS)[number]["key"];

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Best-effort starting point for the mapping UI — fully overridable by the user afterward. */
export function suggestMapping(headers: string[]): Partial<Record<LeadImportFieldKey, number>> {
  const normalizedHeaders = headers.map(normalize);
  const usedColumns = new Set<number>();
  const mapping: Partial<Record<LeadImportFieldKey, number>> = {};

  for (const field of LEAD_IMPORT_FIELDS) {
    const normalizedAliases = field.aliases.map(normalize);
    const idx = normalizedHeaders.findIndex((h, i) => !usedColumns.has(i) && normalizedAliases.includes(h));
    if (idx !== -1) {
      mapping[field.key] = idx;
      usedColumns.add(idx);
    }
  }
  return mapping;
}

function normalizePriority(value: string): "LOW" | "MEDIUM" | "HIGH" | undefined {
  const v = value.trim().toLowerCase();
  if (v === "low" || v === "l") return "LOW";
  if (v === "medium" || v === "med" || v === "m") return "MEDIUM";
  if (v === "high" || v === "h") return "HIGH";
  return undefined;
}

/**
 * Resolves one CSV row into a lead-shaped object: a mapped column's value
 * wins when present, otherwise the field's default fills the gap — "give a
 * default value, fill the rest in later" per the product ask.
 */
export function resolveRow(
  row: string[],
  mapping: Partial<Record<LeadImportFieldKey, number>>,
  defaults: Partial<Record<LeadImportFieldKey, string>>,
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const field of LEAD_IMPORT_FIELDS) {
    const colIndex = mapping[field.key];
    const rawValue = colIndex !== undefined ? row[colIndex]?.trim() : undefined;
    const value = rawValue || defaults[field.key]?.trim() || undefined;
    if (!value) continue;
    result[field.key] = field.key === "priority" ? normalizePriority(value) : value;
  }
  return result;
}
