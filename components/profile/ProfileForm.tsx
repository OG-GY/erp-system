"use client";

import { useActionState } from "react";
import { updateMyProfile, type UpdateProfileState } from "@/lib/actions/profile";

const initialState: UpdateProfileState = { error: null, success: false };

function dateInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function ProfileForm({
  personalEmail,
  phone,
  dateOfBirth,
  gender,
  residentialAddress,
  emergencyContactName,
  emergencyContactPhone,
}: {
  personalEmail: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  residentialAddress: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateMyProfile,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="personalEmail"
          label="Personal email"
          type="email"
          defaultValue={personalEmail ?? ""}
          disabled={isPending}
        />
        <Field
          id="phone"
          label="Phone"
          type="tel"
          defaultValue={phone ?? ""}
          disabled={isPending}
        />
        <Field
          id="dateOfBirth"
          label="Date of birth"
          type="date"
          defaultValue={dateInputValue(dateOfBirth)}
          disabled={isPending}
        />
        <Field
          id="gender"
          label="Gender"
          type="text"
          defaultValue={gender ?? ""}
          disabled={isPending}
        />
        <Field
          id="emergencyContactName"
          label="Emergency contact name"
          type="text"
          defaultValue={emergencyContactName ?? ""}
          disabled={isPending}
        />
        <Field
          id="emergencyContactPhone"
          label="Emergency contact phone"
          type="tel"
          defaultValue={emergencyContactPhone ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="residentialAddress"
          className="text-sm font-medium text-foreground-muted"
        >
          Residential address
        </label>
        <textarea
          id="residentialAddress"
          name="residentialAddress"
          rows={2}
          defaultValue={residentialAddress ?? ""}
          disabled={isPending}
          className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-success">
          Profile updated.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  type,
  defaultValue,
  disabled,
}: {
  id: string;
  label: string;
  type: string;
  defaultValue: string;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
      />
    </div>
  );
}
