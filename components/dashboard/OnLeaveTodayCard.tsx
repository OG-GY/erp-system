import { CalendarOff } from "lucide-react";
import { initials } from "@/lib/format";
import { todayDateOnly } from "@/lib/date";

const LEAVE_TYPE_LABEL = {
  CASUAL: "Casual",
  SICK: "Sick",
  ANNUAL: "Annual",
  UNPAID: "Unpaid",
  EMERGENCY: "Emergency",
} as const;

function formatUntil(endDate: Date, today: Date) {
  if (endDate.getTime() === today.getTime()) return "Last day today";
  return `Until ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(endDate)}`;
}

export function OnLeaveTodayCard({
  leaveRequests,
}: {
  leaveRequests: {
    id: string;
    leaveType: keyof typeof LEAVE_TYPE_LABEL;
    startDate: Date;
    endDate: Date;
    employee: { id: string; fullName: string; designation: string | null };
  }[];
}) {
  const today = todayDateOnly();

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs text-foreground-muted">
        <CalendarOff className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
        On leave today
      </p>

      {leaveRequests.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          No one is on leave today.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {leaveRequests.map((request) => (
            <li
              key={request.id}
              className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-warning/15 text-[10px] font-semibold text-warning">
                  {initials(request.employee.fullName)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-foreground">
                    {request.employee.fullName}
                  </span>
                  <span className="block truncate text-xs text-foreground-muted">
                    {LEAVE_TYPE_LABEL[request.leaveType]} leave
                    {request.employee.designation
                      ? ` · ${request.employee.designation}`
                      : ""}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-xs text-foreground-muted">
                {formatUntil(request.endDate, today)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
