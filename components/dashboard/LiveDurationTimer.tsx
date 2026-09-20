"use client";

import { useEffect, useState } from "react";

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Ticks once a second, always computed as (now - anchor) - pausedMs — never
 * persists its own state anywhere (no localStorage, no "resume" logic). The
 * anchor is a server-issued timestamp already durable in the database
 * (see checkIn/startBreak in lib/actions/attendance.ts, which stamp
 * `new Date()` server-side, never trusting a client-supplied instant), so a
 * refresh or crash has nothing to recover — it just re-fetches the anchor
 * and this recomputes from scratch, landing on the same value.
 *
 * Re-reads the clock on tab focus/visibility change to correct for drift
 * from background-tab timer throttling — the lightweight equivalent of
 * "sync" here; no polling or websocket is needed since there's no shared
 * mutable state to reconcile, just a subtraction from a fixed point.
 */
export function LiveDurationTimer({
  anchor,
  pausedMs = 0,
  className,
}: {
  anchor: Date;
  pausedMs?: number;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") setNow(Date.now());
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const elapsedMs = now - anchor.getTime() - pausedMs;

  // Server and client will essentially never agree on "the current second"
  // — this is the same class of unavoidable divergence as a clock or
  // timestamp, which is what suppressHydrationWarning exists for.
  return (
    <span className={className} suppressHydrationWarning>
      {formatDuration(elapsedMs)}
    </span>
  );
}
