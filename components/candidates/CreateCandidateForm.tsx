"use client";

import { useActionState } from "react";
import { createCandidate, type CreateCandidateState } from "@/lib/actions/candidates";
import { Input } from "@/components/ui/Input";

const initialState: CreateCandidateState = { error: null };

export function CreateCandidateForm() {
  const [state, formAction, isPending] = useActionState(
    createCandidate,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground-muted">
          Candidate name
        </label>
        <Input id="fullName" name="fullName" type="text" required disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="position" className="text-sm font-medium text-foreground-muted">
          Position
        </label>
        <Input id="position" name="position" type="text" required disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground-muted">
            Email
          </label>
          <Input id="email" name="email" type="email" disabled={isPending} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-foreground-muted">
            Phone
          </label>
          <Input id="phone" name="phone" type="tel" disabled={isPending} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="interviewDate" className="text-sm font-medium text-foreground-muted">
          Interview date
        </label>
        <Input
          id="interviewDate"
          name="interviewDate"
          type="date"
          disabled={isPending}
          className="w-44"
        />
      </div>

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
        {isPending ? "Adding…" : "Add candidate"}
      </button>
    </form>
  );
}
