"use client";

import { useActionState } from "react";
import { updateLead, type UpdateLeadState } from "@/lib/actions/leads";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { ErrorToast } from "@/components/ui/Toast";

const initialState: UpdateLeadState = { error: null, success: false };

const PRIORITY_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

type Defaults = {
  businessName: string;
  industry: string;
  city: string;
  area: string;
  businessOwnerName: string;
  contactName: string;
  contactRole: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  source: string;
  notes: string;
  onlinePresence: string;
  identifiedNeeds: string;
  priority: string;
};

export function EditLeadForm({ leadId, defaults }: { leadId: string; defaults: Defaults }) {
  const boundAction = updateLead.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="businessName" name="businessName" label="Business name" required disabled={isPending} defaultValue={defaults.businessName} />
        <Field id="industry" name="industry" label="Industry" disabled={isPending} defaultValue={defaults.industry} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="city" name="city" label="City" disabled={isPending} defaultValue={defaults.city} />
        <Field id="area" name="area" label="Area" disabled={isPending} defaultValue={defaults.area} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field id="businessOwnerName" name="businessOwnerName" label="Business owner name" disabled={isPending} defaultValue={defaults.businessOwnerName} />
        <Field id="contactName" name="contactName" label="Contact person" disabled={isPending} defaultValue={defaults.contactName} />
        <Field id="contactRole" name="contactRole" label="Contact's role" disabled={isPending} defaultValue={defaults.contactRole} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field id="phone" name="phone" label="Phone" type="tel" disabled={isPending} defaultValue={defaults.phone} />
        <Field id="whatsapp" name="whatsapp" label="WhatsApp" type="tel" disabled={isPending} defaultValue={defaults.whatsapp} />
        <Field id="email" name="email" label="Email" type="email" disabled={isPending} defaultValue={defaults.email} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="website" name="website" label="Website" disabled={isPending} defaultValue={defaults.website} />
        <Field id="source" name="source" label="Source" disabled={isPending} defaultValue={defaults.source} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="priority" className="text-sm font-medium text-foreground-muted">
          Priority / fit
        </label>
        <Select
          id="priority"
          name="priority"
          defaultValue={defaults.priority}
          disabled={isPending}
          className="sm:w-48"
          options={PRIORITY_OPTIONS}
        />
      </div>

      <TextField id="onlinePresence" name="onlinePresence" label="Current online presence" disabled={isPending} defaultValue={defaults.onlinePresence} />
      <TextField id="identifiedNeeds" name="identifiedNeeds" label="Problems / needs identified" disabled={isPending} defaultValue={defaults.identifiedNeeds} />
      <TextField id="notes" name="notes" label="Notes" disabled={isPending} defaultValue={defaults.notes} />

      <ErrorToast message={state.error} trigger={state} />
      {state.success ? (
        <p role="status" className="text-sm text-success">
          Saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
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
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  disabled: boolean;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
        {label}
      </label>
      <Input id={id} name={name} type={type} required={required} disabled={disabled} defaultValue={defaultValue} />
    </div>
  );
}

function TextField({
  id,
  name,
  label,
  disabled,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  disabled: boolean;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
        {label}
      </label>
      <Textarea id={id} name={name} rows={2} disabled={disabled} defaultValue={defaultValue} />
    </div>
  );
}
