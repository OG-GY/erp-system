import { initials } from "@/lib/format";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ActiveCheckInsList({
  employees,
}: {
  employees: {
    id: string;
    fullName: string;
    designation: string | null;
    checkIn: Date;
  }[];
}) {
  return (
    <div id="active-checkins" className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">
        Active check-ins — {employees.length}{" "}
        {employees.length === 1 ? "person" : "people"} currently checked in
      </p>

      {employees.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          No one is currently checked in.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {employees.map((employee) => (
            <li
              key={employee.id}
              className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/12 text-[10px] font-semibold text-accent">
                  {initials(employee.fullName)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-foreground">
                    {employee.fullName}
                  </span>
                  {employee.designation ? (
                    <span className="block truncate text-xs text-foreground-muted">
                      {employee.designation}
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="shrink-0 text-xs text-foreground-muted">
                Since {formatTime(employee.checkIn)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
