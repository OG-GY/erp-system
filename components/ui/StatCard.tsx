import type { LucideIcon } from "lucide-react";

const TONE_CLASSES = {
  accent: "bg-accent/12 text-accent",
  amber: "bg-accent-secondary/15 text-accent-secondary",
  success: "bg-success/12 text-success",
  info: "bg-info/12 text-info",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
      {Icon ? (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-xs text-foreground-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
