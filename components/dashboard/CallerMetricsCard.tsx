import type { CallerMetrics } from "@/lib/leadMetrics";

export function CallerMetricsCard({ metrics }: { metrics: CallerMetrics }) {
  const items = [
    { label: "Leads added", value: metrics.leadsAdded },
    { label: "Calls made", value: metrics.callsAttempted },
    { label: "Connected", value: metrics.callsConnected },
    { label: "Qualified", value: metrics.qualifiedLeads },
    { label: "Meetings booked", value: metrics.meetingsBooked },
    { label: "Won", value: metrics.dealsWon },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">This week</p>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-lg font-semibold text-foreground">{item.value}</p>
            <p className="text-xs text-foreground-muted">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
