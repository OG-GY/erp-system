import { addTeamMember } from "@/lib/actions/teams";
import { TeamMemberRow } from "@/components/teams/TeamMemberRow";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function TeamMembersPanel({
  teamId,
  members,
  availableEmployees,
}: {
  teamId: string;
  members: { membershipId: string; id: string; fullName: string; role: string }[];
  availableEmployees: { id: string; fullName: string }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">
        Members — {members.length}
      </p>

      {members.length === 0 ? (
        <p className="mb-3 text-sm text-foreground-muted">No members yet.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-1.5">
          {members.map((member) => (
            <TeamMemberRow
              key={member.membershipId}
              teamId={teamId}
              membershipId={member.membershipId}
              fullName={member.fullName}
              role={member.role}
            />
          ))}
        </ul>
      )}

      {availableEmployees.length > 0 ? (
        <form
          action={addTeamMember.bind(null, teamId)}
          className="flex flex-wrap items-end gap-2"
        >
          <Select
            name="employeeId"
            required
            defaultValue=""
            placeholder="Add employee…"
            className="min-w-[10rem] flex-1"
            options={availableEmployees.map((e) => ({
              value: e.id,
              label: e.fullName,
            }))}
          />
          <Input
            name="role"
            placeholder="Role (optional)"
            className="w-36"
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
