import { Trash2 } from "lucide-react";
import { addProjectMember, removeProjectMember } from "@/lib/actions/projects";
import { initials } from "@/lib/format";
import { Select } from "@/components/ui/Select";

export function MembersPanel({
  projectId,
  members,
  availableEmployees,
}: {
  projectId: string;
  members: { id: string; fullName: string }[];
  availableEmployees: { id: string; fullName: string }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">Members</p>

      {members.length === 0 ? (
        <p className="text-sm text-foreground-muted">No members yet.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-1.5">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-sm"
            >
              <span className="flex items-center gap-2 text-foreground">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/12 text-[10px] font-semibold text-accent">
                  {initials(member.fullName)}
                </span>
                {member.fullName}
              </span>
              <form
                action={removeProjectMember.bind(null, projectId, member.id)}
              >
                <button
                  type="submit"
                  aria-label={`Remove ${member.fullName}`}
                  title="Remove"
                  className="rounded-sm p-1 text-danger transition-colors hover:bg-danger/12"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {availableEmployees.length > 0 ? (
        <form
          action={addProjectMember.bind(null, projectId)}
          className="flex gap-2"
        >
          <Select
            name="employeeId"
            required
            defaultValue=""
            placeholder="Add employee…"
            className="flex-1"
            options={availableEmployees.map((e) => ({
              value: e.id,
              label: e.fullName,
            }))}
          />
          <button
            type="submit"
            className="h-9 rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground hover:bg-overlay-hover"
          >
            Add
          </button>
        </form>
      ) : null}
    </div>
  );
}
