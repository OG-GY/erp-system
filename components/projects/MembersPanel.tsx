import { addProjectMember, removeProjectMember } from "@/lib/actions/projects";
import { initials } from "@/lib/format";

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
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-[10px] font-semibold text-accent">
                  {initials(member.fullName)}
                </span>
                {member.fullName}
              </span>
              <form
                action={removeProjectMember.bind(null, projectId, member.id)}
              >
                <button
                  type="submit"
                  className="text-xs font-medium text-danger hover:underline"
                >
                  Remove
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
          <select
            name="employeeId"
            required
            defaultValue=""
            className="h-9 flex-1 rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <option value="" disabled>
              Add employee…
            </option>
            {availableEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 rounded-md border border-border-strong px-3 text-sm font-medium text-foreground hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          >
            Add
          </button>
        </form>
      ) : null}
    </div>
  );
}
