import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { initials } from "@/lib/format";

export function PresentTodayCard({
  count,
  activeNow,
}: {
  count: number;
  activeNow: { id: string; fullName: string }[];
}) {
  const preview = activeNow.slice(0, 5);
  const overflow = activeNow.length - preview.length;

  return (
    <Link
      href="#active-checkins"
      className="flex flex-col rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-overlay-hover"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-foreground-muted">Present today</p>
          <p className="mt-0.5 text-2xl font-extrabold text-foreground">{count}</p>
        </div>
      </div>

      {activeNow.length > 0 ? (
        <div className="mt-3 flex items-center">
          <div className="flex -space-x-2">
            {preview.map((employee) => (
              <span
                key={employee.id}
                title={employee.fullName}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/12 text-[10px] font-semibold text-accent ring-2 ring-surface"
              >
                {initials(employee.fullName)}
              </span>
            ))}
          </div>
          {overflow > 0 ? (
            <span className="ml-2 text-xs text-foreground-muted">
              +{overflow} more
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
