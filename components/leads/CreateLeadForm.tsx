"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createLead, type CreateLeadState } from "@/lib/actions/leads";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

const initialState: CreateLeadState = { error: null };

const PRIORITY_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function CreateLeadForm() {
  const [state, formAction, isPending] = useActionState(createLead, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="businessName" name="businessName" label="Business name" required disabled={isPending} />
        <Field id="industry" name="industry" label="Industry" disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="city" name="city" label="City" disabled={isPending} />
        <Field id="area" name="area" label="Area" disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="contactName" name="contactName" label="Contact person" disabled={isPending} />
        <Field id="contactRole" name="contactRole" label="Contact's role" disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field id="phone" name="phone" label="Phone" type="tel" disabled={isPending} />
        <Field id="whatsapp" name="whatsapp" label="WhatsApp" type="tel" disabled={isPending} />
        <Field id="email" name="email" label="Email" type="email" disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="website" name="website" label="Website" disabled={isPending} />
        <Field id="source" name="source" label="Source" placeholder="e.g. Referral, LinkedIn, Cold outreach" disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="priority" className="text-sm font-medium text-foreground-muted">
          Priority / fit
        </label>
        <Select
          id="priority"
          name="priority"
          defaultValue=""
          disabled={isPending}
          className="sm:w-48"
          options={PRIORITY_OPTIONS}
        />
      </div>

      <TextField id="onlinePresence" name="onlinePresence" label="Current online presence" disabled={isPending} />
      <TextField id="identifiedNeeds" name="identifiedNeeds" label="Problems / needs identified" disabled={isPending} />
      <TextField id="notes" name="notes" label="Notes" disabled={isPending} />

      {state.duplicates && state.duplicates.length > 0 ? (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
          <p className="mb-2 text-sm font-medium text-foreground">
            Possible duplicate{state.duplicates.length > 1 ? "s" : ""} found:
          </p>
          <ul className="mb-3 flex flex-col gap-1">
            {state.duplicates.map((d) => (
              <li key={d.id} className="text-sm">
                <Link href={`/leads/${d.id}`} className="text-accent hover:underline">
                  {d.businessName}
                </Link>
                {d.phone ? <span className="text-foreground-muted"> · {d.phone}</span> : null}
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
            Add anyway — this is a different business
          </button>
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add lead"}
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  disabled,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
        {label}
      </label>
      <Input id={id} name={name} type={type} required={required} disabled={disabled} placeholder={placeholder} />
    </div>
  );
}

function TextField({
  id,
  name,
  label,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
        {label}
      </label>
      <Textarea id={id} name={name} rows={2} disabled={disabled} />
    </div>
  );
}
