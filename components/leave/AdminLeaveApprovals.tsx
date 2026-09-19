import { StatusBadge } from "@/components/ui/StatusBadge";
import { approveLeaveRequest, rejectLeaveRequest } from "@/lib/actions/leave";

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

export function AdminLeaveApprovals({
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
    employee: { fullName: string };
  }[];
}) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">No leave requests.</p>
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
              {request.employee.fullName} ·{" "}
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
              <div className="flex gap-2">
                <form action={approveLeaveRequest.bind(null, request.id)}>
                  <button
                    type="submit"
                    className="text-xs font-medium text-success hover:underline"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectLeaveRequest.bind(null, request.id)}>
                  <button
                    type="submit"
                    className="text-xs font-medium text-danger hover:underline"
                  >
                    Reject
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
