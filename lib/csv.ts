/**
 * Minimal RFC-4180-ish CSV parser — handles quoted fields, embedded commas,
 * embedded newlines, and escaped quotes ("" inside a quoted field). No new
 * dependency for what's a bounded, well-understood parsing problem; this
 * runs client-side only (the raw file is never uploaded to the server —
 * only the structured rows the user has mapped and confirmed are).
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Strip a leading UTF-8 BOM, which Excel exports commonly include and
  // which would otherwise end up stuck to the first header's name.
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  // Last field/row, if the file doesn't end with a trailing newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headers, ...dataRows] = rows;
  return { headers: headers.map((h) => h.trim()), rows: dataRows };
}
