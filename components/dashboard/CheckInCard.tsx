"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  startBreak,
  resumeFromBreak,
  checkAutoCheckOut,
  type AttendanceActionState,
} from "@/lib/actions/attendance";
import { AUTO_CHECKOUT_MS } from "@/lib/attendance-constants";
import { CheckInModal } from "@/components/dashboard/CheckInModal";
import { CheckOutModal } from "@/components/dashboard/CheckOutModal";
import {
  LiveDurationTimer,
  formatDuration,
} from "@/components/dashboard/LiveDurationTimer";

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
  completedBreakMs,
}: {
  checkInTime: Date | null;
  checkOutTime: Date | null;
  openBreakStartedAt: Date | null;
  completedBreakMs: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);

  // If check-in/break state changed elsewhere (another tab, another device)
  // while this tab was in the background, refetch on refocus rather than
  // polling continuously — the state here is only ever a few actions deep,
  // so "catch up when looked at again" is enough.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [router]);

  // Auto-checkout once AUTO_CHECKOUT_MS has passed since check-in. This
  // timer is only a wake-up call — checkAutoCheckOut() re-verifies checkIn
  // against the server's own clock before closing anything, so a wrong or
  // throttled client timer can't force an early or fake checkout. Checking
  // immediately (not just scheduling the timeout) covers reopening the tab
  // after the limit already passed while it was closed.
  useEffect(() => {
    if (!checkInTime || checkOutTime) return;

    function verifyAndAutoCheckOut() {
      startTransition(async () => {
        const result = await checkAutoCheckOut();
        if (result.success) router.refresh();
      });
    }

    const msUntilAutoCheckOut =
      checkInTime.getTime() + AUTO_CHECKOUT_MS - Date.now();

    if (msUntilAutoCheckOut <= 0) {
      verifyAndAutoCheckOut();
      return;
    }

    const timeoutId = setTimeout(verifyAndAutoCheckOut, msUntilAutoCheckOut);
    return () => clearTimeout(timeoutId);
  }, [checkInTime, checkOutTime, router]);

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
            className="mt-3 h-9 rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
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

          {!checkOutTime ? (
            <div className="mt-2">
              {openBreakStartedAt ? (
                <>
                  <p className="text-xs text-foreground-muted">Worked so far</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {formatDuration(
                      openBreakStartedAt.getTime() -
                        checkInTime.getTime() -
                        completedBreakMs,
                    )}
                  </p>
                  <p className="mt-2 text-xs text-warning">
                    On break since {formatTime(openBreakStartedAt)}
                  </p>
                  <LiveDurationTimer
                    anchor={openBreakStartedAt}
                    className="text-lg font-semibold tabular-nums text-warning"
                  />
                </>
              ) : (
                <>
                  <p className="text-xs text-foreground-muted">Worked so far</p>
                  <LiveDurationTimer
                    anchor={checkInTime}
                    pausedMs={completedBreakMs}
                    className="text-2xl font-bold tabular-nums text-foreground"
                  />
                </>
              )}
            </div>
          ) : null}

          {!checkOutTime ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {openBreakStartedAt ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handle(resumeFromBreak)}
                  className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
                >
                  {isPending ? "Resuming…" : "Resume"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handle(startBreak)}
                  className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
                >
                  {isPending ? "Starting…" : "Start break"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setCheckOutModalOpen(true)}
                className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
              >
                Check out
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
      {checkOutModalOpen ? (
        <CheckOutModal onClose={() => setCheckOutModalOpen(false)} />
      ) : null}
    </div>
  );
}
