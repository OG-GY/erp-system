import { StatusBadge } from "@/components/ui/StatusBadge";

type Member = { id: string; fullName: string; role: string };
type Team = {
  id: string;
  name: string;
  description: string | null;
  myRole: string;
  members: Member[];
};

export function MyTeamsList({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
        <p className="text-sm font-medium text-foreground">
          You&apos;re not part of any team yet
        </p>
        <p className="text-sm text-foreground-muted">
          Teams you&apos;re added to will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {teams.map((team) => (
        <section
          key={team.id}
          id={team.id}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {team.name}
              </h3>
              {team.description ? (
                <p className="text-xs text-foreground-muted">
                  {team.description}
                </p>
              ) : null}
            </div>
            <StatusBadge label={team.myRole} tone="neutral" />
          </div>

          <ul className="flex flex-col gap-1.5">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <span className="truncate text-foreground">
                  {member.fullName}
                </span>
                <span className="text-xs text-foreground-muted">
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
