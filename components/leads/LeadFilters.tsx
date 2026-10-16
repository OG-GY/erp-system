import Link from "next/link";

const CONTROL =
  "h-8 rounded-sm border border-border-strong bg-surface px-2 text-sm text-foreground";

/**
 * Plain GET form — filters live in the URL, so they survive refresh, work
 * with the Board/Table toggle, and need no client JavaScript.
 */
export function LeadFilters({
  isTableView,
  values,
  statusOptions,
  priorityOptions,
  callers,
  hasFilters,
}: {
  isTableView: boolean;
  values: {
    q: string;
    status: string;
    priority: string;
    owner: string;
    simCall: boolean;
    overdue: boolean;
  };
  statusOptions: readonly (readonly [string, string])[];
  priorityOptions: readonly (readonly [string, string])[];
  callers: { id: string; fullName: string }[];
  hasFilters: boolean;
}) {
  return (
    <form method="get" action="/leads" className="mb-4 flex flex-wrap items-center gap-2">
      {isTableView ? <input type="hidden" name="view" value="table" /> : null}
      <input
        type="search"
        name="q"
        defaultValue={values.q}
        placeholder="Search name, owner, contact, phone, city"
        aria-label="Search leads"
        className={`${CONTROL} w-64`}
      />
      <select name="status" defaultValue={values.status} aria-label="Status" className={CONTROL}>
        <option value="">All statuses</option>
        {statusOptions.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select name="priority" defaultValue={values.priority} aria-label="Priority" className={CONTROL}>
        <option value="">Any priority</option>
        {priorityOptions.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {callers.length > 0 || values.owner ? (
        <select name="owner" defaultValue={values.owner} aria-label="Assigned to" className={CONTROL}>
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {callers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
      ) : null}
      <label className="flex items-center gap-1.5 text-sm text-foreground-muted">
        <input type="checkbox" name="overdue" value="1" defaultChecked={values.overdue} />
        Overdue follow-up
      </label>
      <label className="flex items-center gap-1.5 text-sm text-foreground-muted">
        <input type="checkbox" name="simCall" value="1" defaultChecked={values.simCall} />
        Needs SIM call
      </label>
      <button
        type="submit"
        className="h-8 rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Apply
      </button>
      {hasFilters ? (
        <Link
          href={isTableView ? "/leads?view=table" : "/leads"}
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          Clear
        </Link>
      ) : null}
    </form>
  );
}
