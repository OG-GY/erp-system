"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  createColdLead,
  updateColdLead,
  type ColdDuplicate,
  type ColdLeadFormState,
} from "@/lib/actions/coldCalling";
import { COLD_SOURCE_LABEL } from "@/lib/coldCalling";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

const SOURCE_OPTIONS = Object.entries(COLD_SOURCE_LABEL).map(([value, label]) => ({ value, label }));

export type ColdLeadDefaults = {
  businessName: string;
  phone: string;
  whatsapp: string;
  category: string;
  city: string;
  area: string;
  contactName: string;
  source: string;
  sourceDetail: string;
  notes: string;
};

export const EMPTY_COLD_LEAD_DEFAULTS: ColdLeadDefaults = {
  businessName: "",
  phone: "",
  whatsapp: "",
  category: "",
  city: "",
  area: "",
  contactName: "",
  source: "GOOGLE_MAPS",
  sourceDetail: "",
  notes: "",
};

export function formDataToDefaults(formData: FormData): ColdLeadDefaults {
  const get = (key: keyof ColdLeadDefaults) => String(formData.get(key) ?? "");
  return {
    businessName: get("businessName"),
    phone: get("phone"),
    whatsapp: get("whatsapp"),
    category: get("category"),
    city: get("city"),
    area: get("area"),
    contactName: get("contactName"),
    source: get("source") || "GOOGLE_MAPS",
    sourceDetail: get("sourceDetail"),
    notes: get("notes"),
  };
}

/**
 * Create when `coldLeadId` is omitted, edit otherwise. Saving runs in the
 * background (processing → done toast). In create mode `onSubmitted` fires
 * immediately so a hosting modal can close; if the save fails or finds a
 * duplicate number, `onRejected` hands the draft back so it can reopen.
 */
export function ColdLeadForm({
  coldLeadId,
  defaults = EMPTY_COLD_LEAD_DEFAULTS,
  initialDuplicates,
  onSubmitted,
  onRejected,
}: {
  coldLeadId?: string;
  defaults?: ColdLeadDefaults;
  initialDuplicates?: ColdDuplicate[];
  onSubmitted?: () => void;
  onRejected?: (draft: ColdLeadDefaults, duplicates: ColdDuplicate[] | undefined) => void;
}) {
  const { track } = useToast();
  const [duplicates, setDuplicates] = useState(initialDuplicates);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(e.currentTarget, submitter);
    const name = String(formData.get("businessName") ?? "").trim();
    const action = coldLeadId ? updateColdLead.bind(null, coldLeadId) : createColdLead;

    setDuplicates(undefined);
    setIsSaving(true);
    onSubmitted?.();
    const result = await track<ColdLeadFormState>(
      coldLeadId
        ? { pending: `Saving ${name}…`, done: "Changes saved" }
        : {
            pending: `Adding ${name}…`,
            // Duplicates aren't a failure or a success: the draft reopens with the warning.
            done: (r) => (r.duplicates?.length ? null : `${name} added`),
          },
      () => action({ error: null }, formData),
    );
    setIsSaving(false);

    if (!coldLeadId && (!result || result.error || result.duplicates?.length)) {
      setDuplicates(result?.duplicates);
      onRejected?.(formDataToDefaults(formData), result?.duplicates);
    }
  }

  const isPending = isSaving;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="businessName" label="Business name" defaultValue={defaults.businessName} required disabled={isPending} />
        <Field name="phone" label="Phone number" type="tel" defaultValue={defaults.phone} required disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          name="category"
          label="Type of business"
          placeholder="e.g. Restaurant, Salon, Clinic"
          defaultValue={defaults.category}
          disabled={isPending}
        />
        <Field name="contactName" label="Person's name" defaultValue={defaults.contactName} disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field name="city" label="City" defaultValue={defaults.city} disabled={isPending} />
        <Field name="area" label="Area" defaultValue={defaults.area} disabled={isPending} />
        <Field
          name="whatsapp"
          label="WhatsApp (if different)"
          type="tel"
          defaultValue={defaults.whatsapp}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="source" className="text-sm font-medium text-foreground-muted">
            Where did you find them?
          </label>
          <Select id="source" name="source" defaultValue={defaults.source} disabled={isPending} options={SOURCE_OPTIONS} />
        </div>
        <Field
          name="sourceDetail"
          label="Maps link / referred by"
          defaultValue={defaults.sourceDetail}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-foreground-muted">
          Notes
        </label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={defaults.notes} disabled={isPending} />
      </div>

      {duplicates && duplicates.length > 0 ? (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
          <p className="mb-2 text-sm font-medium text-foreground">This number is already in the system:</p>
          <ul className="mb-3 flex flex-col gap-1">
            {duplicates.map((d) => (
              <li key={`${d.where}-${d.id}`} className="text-sm">
                <Link
                  href={d.where === "cold" ? `/cold-calling/${d.id}` : `/leads/${d.id}`}
                  className="text-accent hover:underline"
                >
                  {d.businessName}
                </Link>
                <span className="text-foreground-muted">
                  {d.where === "cold" ? ` · cold calling, added by ${d.addedBy}` : " · in Leads"}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="submit"
            name="confirmDuplicate"
            value="true"
            disabled={isPending}
            className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
          >
            Add anyway
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {coldLeadId ? (isPending ? "Saving…" : "Save changes") : isPending ? "Adding…" : "Add business"}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
  disabled,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue: string;
  required?: boolean;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground-muted">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}
