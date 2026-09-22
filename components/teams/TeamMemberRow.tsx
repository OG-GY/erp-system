"use client";

import { useActionState } from "react";
import {
  updateTeamMemberRole,
  removeTeamMember,
  type UpdateMemberRoleState,
} from "@/lib/actions/teams";
import { Input } from "@/components/ui/Input";
import { initials } from "@/lib/format";

const initialState: UpdateMemberRoleState = { error: null, success: false };

export function TeamMemberRow({
  teamId,
  membershipId,
  fullName,
  role,
}: {
  teamId: string;
  membershipId: string;
  fullName: string;
  role: string;
}) {
  const boundAction = updateTeamMemberRole.bind(null, teamId, membershipId);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  return (
    <li className="flex flex-col gap-1 rounded-md px-1 py-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/12 text-[10px] font-semibold text-accent">
            {initials(fullName)}
          </span>
          <span className="min-w-0 truncate text-foreground">{fullName}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <form action={formAction} className="flex items-center gap-1">
            <Input
              name="role"
              defaultValue={role}
              disabled={isPending}
              aria-label={`Role for ${fullName}`}
              className="h-7 w-28 px-2 text-xs"
            />
            <button
              type="submit"
              disabled={isPending}
              className="text-xs font-medium text-accent hover:underline disabled:opacity-60"
            >
              Save
            </button>
          </form>
          <form action={removeTeamMember.bind(null, teamId, membershipId)}>
            <button
              type="submit"
              className="text-xs font-medium text-danger hover:underline"
            >
              Remove
            </button>
          </form>
        </span>
      </div>
      {state.error ? (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      ) : null}
    </li>
  );
}
