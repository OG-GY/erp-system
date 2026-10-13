import Link from "next/link";

type FollowUp = {
  id: string;
  dueDate: Date;
  action: string;
  lead: { id: string; businessName: string };
};

export function FollowUpsDueCard({ followUps }: { followUps: FollowUp[] }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">Follow-ups due — {followUps.length}</p>

      {followUps.length === 0 ? (
        <p className="text-sm text-foreground-muted">Nothing due. Nice work.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {followUps.map((f) => {
            const dueIso = f.dueDate.toISOString().slice(0, 10);
            const overdue = dueIso < today;
            return (
              <li key={f.id}>
                <Link
                  href={`/leads/${f.lead.id}`}
                  className="flex items-center justify-between gap-2 rounded-sm px-1 py-1 text-sm hover:bg-overlay-hover"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">{f.lead.businessName}</span>
                    <span className="block truncate text-xs text-foreground-muted">{f.action}</span>
                  </span>
                  <span
                    className={`shrink-0 text-xs ${overdue ? "font-medium text-danger" : "text-foreground-muted"}`}
                  >
                    {overdue ? "Overdue" : "Today"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
