"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  checkOut,
  startBreak,
  resumeFromBreak,
  type AttendanceActionState,
} from "@/lib/actions/attendance";
import { CheckInModal } from "@/components/dashboard/CheckInModal";

function formatTime(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function CheckInCard({
  checkInTime,
  checkOutTime,
  openBreakStartedAt,
}: {
  checkInTime: Date | null;
  checkOutTime: Date | null;
  openBreakStartedAt: Date | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function handle(action: () => Promise<AttendanceActionState>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-foreground-muted">Today</p>

      {!checkInTime ? (
        <>
          <p className="mt-1 text-sm text-foreground">Not checked in yet</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-3 h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Check in
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-foreground">
            Checked in at {formatTime(checkInTime)}
            {checkOutTime ? ` · Checked out at ${formatTime(checkOutTime)}` : ""}
          </p>
          {openBreakStartedAt ? (
            <p className="mt-1 text-xs text-warning">
              On break since {formatTime(openBreakStartedAt)}
            </p>
          ) : null}

          {!checkOutTime ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {openBreakStartedAt ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handle(resumeFromBreak)}
                  className="h-9 rounded-lg border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
                >
                  {isPending ? "Resuming…" : "Resume"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handle(startBreak)}
                  className="h-9 rounded-lg border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
                >
                  {isPending ? "Starting…" : "Start break"}
                </button>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={() => handle(checkOut)}
                className="h-9 rounded-lg border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
              >
                {isPending ? "Checking out…" : "Check out"}
              </button>
            </div>
          ) : null}
        </>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {modalOpen ? <CheckInModal onClose={() => setModalOpen(false)} /> : null}
    </div>
  );
}
