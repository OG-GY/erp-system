const TONE_CLASSES: Record<"neutral" | "success" | "warning" | "danger", string> = {
  neutral: "bg-overlay-neutral text-foreground-muted",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className = "",
}: {
  label: string;
  tone?: keyof typeof TONE_CLASSES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {label}
    </span>
  );
}
