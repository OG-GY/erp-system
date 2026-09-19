import Link from "next/link";
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
      className="flex flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.03]"
    >
      <p className="text-xs text-foreground-muted">Present today</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{count}</p>

      {activeNow.length > 0 ? (
        <div className="mt-2 flex items-center">
          <div className="flex -space-x-2">
            {preview.map((employee) => (
              <span
                key={employee.id}
                title={employee.fullName}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-[10px] font-semibold text-accent ring-2 ring-surface"
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
