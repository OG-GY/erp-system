import Link from "next/link";
import { PhoneOff, Signal } from "lucide-react";
import { LeadStatusSelect } from "@/components/leads/LeadStatusSelect";
import { DeleteLeadButton } from "@/components/leads/DeleteLeadButton";

type Lead = {
  id: string;
  businessName: string;
  businessOwnerName: string | null;
  contactName: string | null;
  phone: string | null;
  city: string | null;
  status: string;
  simCallStatus: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | null;
  doNotCall: boolean;
  nextFollowUpDate: Date | null;
  owner: { id: string; fullName: string } | null;
  _count: { calls: number };
};

const PRIORITY_LABEL = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" } as const;

export function LeadTable({ leads, showOwner }: { leads: Lead[]; showOwner: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-foreground-muted">
            <th className="whitespace-nowrap px-3 py-2 font-medium">Business</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Status</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Owner name</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Contact</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Phone</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">City</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Priority</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Next follow-up</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Calls</th>
            {showOwner ? (
              <th className="whitespace-nowrap px-3 py-2 font-medium">Assigned to</th>
            ) : null}
            <th className="px-3 py-2 font-medium">
              <span className="sr-only">Delete</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-overlay-hover">
              <td className="whitespace-nowrap px-3 py-2">
                <Link href={`/leads/${lead.id}`} className="flex items-center gap-1.5 font-medium text-foreground hover:underline">
                  {lead.businessName}
                  {lead.doNotCall ? (
                    <PhoneOff className="h-3 w-3 text-danger" aria-label="Do not call" />
                  ) : null}
                  {lead.simCallStatus && lead.simCallStatus !== "RESOLVED" ? (
                    <Signal className="h-3 w-3 text-warning" aria-label="Needs a SIM/local call" />
                  ) : null}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <LeadStatusSelect leadId={lead.id} status={lead.status} />
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground-muted">{lead.businessOwnerName ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground-muted">{lead.contactName ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground-muted">{lead.phone ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground-muted">{lead.city ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground-muted">
                {lead.priority ? PRIORITY_LABEL[lead.priority] : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground-muted">
                {lead.nextFollowUpDate
                  ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
                      lead.nextFollowUpDate,
                    )
                  : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground-muted">{lead._count.calls}</td>
              {showOwner ? (
                <td className="whitespace-nowrap px-3 py-2 text-foreground-muted">
                  {lead.owner?.fullName ?? "Unassigned"}
                </td>
              ) : null}
              <td className="whitespace-nowrap px-3 py-2">
                <DeleteLeadButton leadId={lead.id} businessName={lead.businessName} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
