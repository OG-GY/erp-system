import { Cake, PartyPopper } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { initials } from "@/lib/format";

function daysLabel(daysUntil: number) {
  if (daysUntil === 0) return "Today!";
  if (daysUntil === 1) return "Tomorrow";
  return `in ${daysUntil} days`;
}

function daysTone(daysUntil: number) {
  if (daysUntil <= 1) return "success";
  if (daysUntil <= 7) return "warning";
  return "neutral";
}

function formatBirthday(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function UpcomingBirthdaysCard({
  birthdays,
}: {
  birthdays: { id: string; fullName: string; dateOfBirth: Date; daysUntil: number }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Cake className="h-3.5 w-3.5 text-accent-secondary" aria-hidden="true" />
        Upcoming birthdays — next 30 days
      </p>

      {birthdays.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          No birthdays in the next 30 days.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {birthdays.map((person) => (
            <li
              key={person.id}
              className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-secondary/15 text-[10px] font-semibold text-accent-secondary">
                  {initials(person.fullName)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-foreground">
                    {person.fullName}
                  </span>
                  <span className="block truncate text-xs text-foreground-muted">
                    {formatBirthday(person.dateOfBirth)}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {person.daysUntil === 0 ? (
                  <PartyPopper
                    className="h-3.5 w-3.5 text-success"
                    aria-hidden="true"
                  />
                ) : null}
                <StatusBadge
                  label={daysLabel(person.daysUntil)}
                  tone={daysTone(person.daysUntil)}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
