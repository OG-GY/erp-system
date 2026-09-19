import { StatusBadge } from "@/components/ui/StatusBadge";
import { cancelLeaveRequest } from "@/lib/actions/leave";

const STATUS_TONE = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
} as const;

const STATUS_LABEL = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
} as const;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export function MyLeaveList({
  requests,
}: {
  requests: {
    id: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    daysCount: number;
    reason: string;
    status: keyof typeof STATUS_LABEL;
  }[];
}) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        You haven&apos;t applied for leave yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {request.leaveType.charAt(0) + request.leaveType.slice(1).toLowerCase()}{" "}
              · {request.daysCount} {request.daysCount === 1 ? "day" : "days"}
            </p>
            <p className="text-xs text-foreground-muted">
              {formatDate(request.startDate)} – {formatDate(request.endDate)}
            </p>
            <p className="mt-1 truncate text-xs text-foreground-muted">
              {request.reason}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge
              label={STATUS_LABEL[request.status]}
              tone={STATUS_TONE[request.status]}
            />
            {request.status === "PENDING" ? (
              <form action={cancelLeaveRequest.bind(null, request.id)}>
                <button
                  type="submit"
                  className="text-xs font-medium text-danger hover:underline"
                >
                  Cancel
                </button>
              </form>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
