import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function MyTeamsCard({
  teams,
}: {
  teams: { id: string; name: string; role: string }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">My teams</p>

      {teams.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          You&apos;re not part of any team yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams#${team.id}`}
                className="flex items-center justify-between gap-2 rounded-sm px-1 py-1 text-sm hover:bg-overlay-hover"
              >
                <span className="truncate text-foreground">{team.name}</span>
                <StatusBadge label={team.role} tone="neutral" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
