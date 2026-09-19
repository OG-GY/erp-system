"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkIn, checkOut } from "@/lib/actions/attendance";

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
}: {
  checkInTime: Date | null;
  checkOutTime: Date | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(action: () => Promise<{ error: string | null }>) {
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
            disabled={isPending}
            onClick={() => handle(checkIn)}
            className="mt-3 h-9 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Checking in…" : "Check in"}
          </button>
        </>
      ) : !checkOutTime ? (
        <>
          <p className="mt-1 text-sm text-foreground">
            Checked in at {formatTime(checkInTime)}
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(checkOut)}
            className="mt-3 h-9 rounded-md border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-black/[.04] disabled:opacity-60 dark:hover:bg-white/[.06]"
          >
            {isPending ? "Checking out…" : "Check out"}
          </button>
        </>
      ) : (
        <p className="mt-1 text-sm text-foreground">
          Checked in at {formatTime(checkInTime)} · Checked out at{" "}
          {formatTime(checkOutTime)}
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
