"use client";

import { useState } from "react";
import Link from "next/link";
import { parseCsv } from "@/lib/csv";
import { suggestMapping, resolveRow, MAX_IMPORT_ROWS } from "@/lib/leadImportFields";
import { importLeads, type ImportLeadsResult } from "@/lib/actions/leadImport";
import {
  CsvMappingStep,
  type FieldMapping,
  type FieldDefaults,
} from "@/components/leads/import/CsvMappingStep";
import { Select } from "@/components/ui/Select";

type Step = "upload" | "map" | "results";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function ImportLeadsWizard({
  callers,
  viewerIsAdmin,
}: {
  callers: { id: string; fullName: string }[];
  viewerIsAdmin: boolean;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [defaults, setDefaults] = useState<FieldDefaults>({});
  const [ownerId, setOwnerId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportLeadsResult | null>(null);

  async function handleFile(file: File) {
    setParseError(null);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setParseError(
        `That file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB) — CSVs are limited to ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
      );
      return;
    }
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setParseError(
        "Couldn't find any data rows in that file. Make sure it's a CSV with a header row.",
      );
      return;
    }
    if (parsed.rows.length > MAX_IMPORT_ROWS) {
      setParseError(
        `That file has ${parsed.rows.length} rows — import at most ${MAX_IMPORT_ROWS} at a time. Split it into smaller files and import each separately.`,
      );
      return;
    }
    setFileName(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(suggestMapping(parsed.headers));
    setDefaults({});
    setStep("map");
  }

  async function handleImport() {
    setIsImporting(true);
    const payload = rows.map((row) => resolveRow(row, mapping, defaults));
    const res = await importLeads(payload, {
      ownerId: viewerIsAdmin ? ownerId || undefined : undefined,
    });
    setIsImporting(false);
    setResult(res);
    setStep("results");
  }

  function reset() {
    setStep("upload");
    setResult(null);
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setDefaults({});
    setOwnerId("");
  }

  if (step === "upload") {
    return (
      <div className="max-w-xl rounded-lg border border-border bg-surface p-6">
        <p className="mb-4 text-sm text-foreground-muted">
          Upload a CSV of leads — you&apos;ll map its columns to lead fields next, with a preview
          before anything is created.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="text-sm text-foreground-muted file:mr-3 file:h-9 file:rounded-md file:border file:border-border-strong file:bg-surface file:px-3 file:text-sm file:font-medium file:text-foreground"
        />
        {parseError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {parseError}
          </p>
        ) : null}
      </div>
    );
  }

  if (step === "map") {
    const validCount = rows.filter((row) => resolveRow(row, mapping, defaults).businessName).length;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-foreground">
            <span className="font-medium">{fileName}</span> — {rows.length}{" "}
            {rows.length === 1 ? "row" : "rows"}
          </p>
          <div className="flex items-center gap-3">
            {viewerIsAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-muted">Assign all to</span>
                <Select
                  value={ownerId}
                  onChange={setOwnerId}
                  placeholder="Unassigned"
                  className="w-44"
                  options={[
                    { value: "", label: "Unassigned" },
                    ...callers.map((c) => ({ value: c.id, label: c.fullName })),
                  ]}
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={reset}
              className="h-9 rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
            >
              Choose a different file
            </button>
          </div>
        </div>

        <CsvMappingStep
          headers={headers}
          rows={rows}
          mapping={mapping}
          defaults={defaults}
          onMappingChange={setMapping}
          onDefaultsChange={setDefaults}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting || validCount === 0}
            className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isImporting ? "Importing…" : `Import ${validCount} ${validCount === 1 ? "lead" : "leads"}`}
          </button>
          {validCount === 0 ? (
            <p className="text-sm text-danger">
              Map a column or set a default for Business name first.
            </p>
          ) : validCount < rows.length ? (
            <p className="text-sm text-foreground-muted">
              {rows.length - validCount} rows are missing a business name and will be skipped.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (step === "results" && result) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          {result.error ? (
            <p role="alert" className="text-sm text-danger">
              {result.error}
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                {result.created} {result.created === 1 ? "lead" : "leads"} imported.
              </p>
              {result.skippedDuplicates.length > 0 ? (
                <p className="mt-1 text-sm text-foreground-muted">
                  {result.skippedDuplicates.length} skipped as possible duplicates.
                </p>
              ) : null}
              {result.invalidRows.length > 0 ? (
                <p className="mt-1 text-sm text-foreground-muted">
                  {result.invalidRows.length} rows skipped — missing a business name.
                </p>
              ) : null}
            </>
          )}
        </div>

        {result.skippedDuplicates.length > 0 ? (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 text-xs text-foreground-muted">Skipped as duplicates</p>
            <ul className="flex flex-col gap-1 text-sm">
              {result.skippedDuplicates.map((d) => (
                <li key={d.row} className="flex items-center justify-between gap-2">
                  <span className="text-foreground-muted">
                    Row {d.row} — {d.businessName}
                  </span>
                  {d.existingLeadId ? (
                    <Link href={`/leads/${d.existingLeadId}`} className="text-accent hover:underline">
                      View existing
                    </Link>
                  ) : (
                    <span className="text-xs text-foreground-muted">Duplicate in file</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Link
            href="/leads"
            className="flex h-9 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Go to Leads board
          </Link>
          <button
            type="button"
            onClick={reset}
            className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
          >
            Import another file
          </button>
        </div>
      </div>
    );
  }

  return null;
}
