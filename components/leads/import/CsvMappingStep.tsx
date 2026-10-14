"use client";

import { useState } from "react";
import { LEAD_IMPORT_FIELDS, type LeadImportFieldKey, resolveRow } from "@/lib/leadImportFields";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

export type FieldMapping = Partial<Record<LeadImportFieldKey, number>>;
export type FieldDefaults = Partial<Record<LeadImportFieldKey, string>>;

export function CsvMappingStep({
  headers,
  rows,
  mapping,
  defaults,
  onMappingChange,
  onDefaultsChange,
}: {
  headers: string[];
  rows: string[][];
  mapping: FieldMapping;
  defaults: FieldDefaults;
  onMappingChange: (mapping: FieldMapping) => void;
  onDefaultsChange: (defaults: FieldDefaults) => void;
}) {
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);

  const mappedColumns = new Set(Object.values(mapping).filter((v): v is number => v !== undefined));

  function mapField(fieldKey: LeadImportFieldKey, columnIndex: number | null) {
    const next: FieldMapping = { ...mapping };
    // A column maps to at most one field — drop it from wherever it was
    // mapped before, so the UI never implies it feeds two fields at once.
    for (const key of Object.keys(next) as LeadImportFieldKey[]) {
      if (next[key] === columnIndex) delete next[key];
    }
    if (columnIndex === null) {
      delete next[fieldKey];
    } else {
      next[fieldKey] = columnIndex;
    }
    onMappingChange(next);
  }

  function setDefault(fieldKey: LeadImportFieldKey, value: string) {
    onDefaultsChange({ ...defaults, [fieldKey]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 text-xs text-foreground-muted">
            Your CSV columns — drag one onto a field, or use the dropdown
          </p>
          <div className="flex flex-col gap-2">
            {headers.map((header, i) => {
              const sample = rows.find((r) => r[i]?.trim())?.[i] ?? "";
              const isMapped = mappedColumns.has(i);
              return (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => {
                    setDraggedColumn(i);
                    e.dataTransfer.setData("text/plain", String(i));
                  }}
                  onDragEnd={() => setDraggedColumn(null)}
                  className={`cursor-grab rounded-md border px-3 py-2 text-sm transition-opacity active:cursor-grabbing ${
                    isMapped ? "border-accent/40 bg-accent/5" : "border-border bg-background"
                  } ${draggedColumn === i ? "opacity-50" : ""}`}
                >
                  <p className="truncate font-medium text-foreground">{header}</p>
                  {sample ? <p className="truncate text-xs text-foreground-muted">{sample}</p> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 text-xs text-foreground-muted">Lead fields</p>
          <div className="flex flex-col gap-3">
            {LEAD_IMPORT_FIELDS.map((field) => {
              const columnIndex = mapping[field.key];
              const mappedHeader = columnIndex !== undefined ? headers[columnIndex] : null;

              return (
                <div
                  key={field.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const idx = Number(e.dataTransfer.getData("text/plain"));
                    if (!Number.isNaN(idx)) mapField(field.key, idx);
                  }}
                  className="rounded-md border border-dashed border-border p-2"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground-muted">
                      {field.label}
                      {"required" in field && field.required ? (
                        <span className="text-danger"> *</span>
                      ) : null}
                    </p>
                    {mappedHeader ? (
                      <span className="flex items-center gap-1 rounded-sm bg-accent/12 px-2 py-0.5 text-xs text-accent">
                        {mappedHeader}
                        <button
                          type="button"
                          onClick={() => mapField(field.key, null)}
                          aria-label={`Unmap ${field.label}`}
                          className="hover:text-danger"
                        >
                          ×
                        </button>
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      aria-label={`Map a column to ${field.label}`}
                      value={columnIndex !== undefined ? String(columnIndex) : ""}
                      onChange={(v) => mapField(field.key, v === "" ? null : Number(v))}
                      placeholder="No column mapped"
                      className="flex-1"
                      options={[
                        { value: "", label: "No column mapped" },
                        ...headers.map((h, i) => ({ value: String(i), label: h })),
                      ]}
                    />
                    <Input
                      placeholder="Default (optional)"
                      value={defaults[field.key] ?? ""}
                      onChange={(e) => setDefault(field.key, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-3 text-xs text-foreground-muted">
          Preview — first {Math.min(5, rows.length)} of {rows.length} rows
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-foreground-muted">
                {LEAD_IMPORT_FIELDS.map((f) => (
                  <th key={f.key} className="whitespace-nowrap px-3 py-2 font-medium">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, i) => {
                const resolved = resolveRow(row, mapping, defaults);
                return (
                  <tr key={i} className="border-b border-border last:border-0">
                    {LEAD_IMPORT_FIELDS.map((f) => (
                      <td key={f.key} className="whitespace-nowrap px-3 py-2 text-foreground-muted">
                        {resolved[f.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
