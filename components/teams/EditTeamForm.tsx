"use client";

import { useActionState } from "react";
import { updateTeam, type UpdateTeamState } from "@/lib/actions/teams";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const initialState: UpdateTeamState = { error: null, success: false };

export function EditTeamForm({
  teamId,
  defaultName,
  defaultDescription,
}: {
  teamId: string;
  defaultName: string;
  defaultDescription: string;
}) {
  const boundAction = updateTeam.bind(null, teamId);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground-muted">
          Team name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-medium text-foreground-muted"
        >
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={defaultDescription}
          disabled={isPending}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
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
