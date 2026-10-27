"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createColdLead,
  updateColdLead,
  type ColdLeadFormState,
} from "@/lib/actions/coldCalling";
import { COLD_SOURCE_LABEL } from "@/lib/coldCalling";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { ErrorToast } from "@/components/ui/Toast";

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

const EMPTY_DEFAULTS: ColdLeadDefaults = {
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

/** Create when `coldLeadId` is omitted, edit otherwise. */
export function ColdLeadForm({
  coldLeadId,
  defaults = EMPTY_DEFAULTS,
}: {
  coldLeadId?: string;
  defaults?: ColdLeadDefaults;
}) {
  const action = coldLeadId ? updateColdLead.bind(null, coldLeadId) : createColdLead;
  const [state, formAction, isPending] = useActionState<ColdLeadFormState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

      {state.duplicates && state.duplicates.length > 0 ? (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
          <p className="mb-2 text-sm font-medium text-foreground">This number is already in the system:</p>
          <ul className="mb-3 flex flex-col gap-1">
            {state.duplicates.map((d) => (
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

      <ErrorToast message={state.error} trigger={state} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {coldLeadId ? (isPending ? "Saving…" : "Save changes") : isPending ? "Adding…" : "Add business"}
        </button>
        {state.success ? (
          <p role="status" className="text-sm text-success">
            Saved.
          </p>
        ) : null}
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
