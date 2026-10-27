import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import type { ColdLeadSource, ColdLeadStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LogCallForm } from "@/components/cold-calling/LogCallForm";
import { formatDateTime } from "@/lib/format";
import { COLD_SOURCE_LABEL, COLD_STATUS_LABEL, COLD_STATUS_TONE, whatsappLink } from "@/lib/coldCalling";

export type ColdLeadListItem = {
  id: string;
  businessName: string;
  category: string | null;
  city: string | null;
  area: string | null;
  phone: string;
  whatsapp: string | null;
  source: ColdLeadSource;
  status: ColdLeadStatus;
  followUpAt: Date | null;
  owner: { fullName: string };
  logs: { notes: string | null }[];
};

export function ContactButtons({ phone, whatsapp }: { phone: string; whatsapp: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`tel:${phone}`}
        className="flex h-8 items-center gap-1.5 rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
      >
        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
        {phone}
      </a>
      <a
        href={whatsappLink(whatsapp ?? phone)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 items-center gap-1.5 rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        WhatsApp
      </a>
    </div>
  );
}

export function FollowUpLabel({ followUpAt, now }: { followUpAt: Date | null; now: Date }) {
  if (!followUpAt) return null;
  const overdue = followUpAt < now;
  return (
    <p className={`text-xs ${overdue ? "font-medium text-danger" : "text-foreground-muted"}`}>
      {overdue ? "Overdue · " : "Next: "}
      {formatDateTime(followUpAt)}
    </p>
  );
}

export function ColdLeadCard({
  lead,
  showOwner,
  now,
}: {
  lead: ColdLeadListItem;
  showOwner: boolean;
  now: Date;
}) {
  const meta = [lead.category, [lead.area, lead.city].filter(Boolean).join(", "), COLD_SOURCE_LABEL[lead.source]]
    .filter(Boolean)
    .join(" · ");
  const lastNote = lead.logs[0]?.notes;

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/cold-calling/${lead.id}`} className="font-semibold text-foreground hover:underline">
            {lead.businessName}
          </Link>
          {meta ? <p className="text-xs text-foreground-muted">{meta}</p> : null}
          {showOwner ? <p className="text-xs text-foreground-muted">Added by {lead.owner.fullName}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge label={COLD_STATUS_LABEL[lead.status]} tone={COLD_STATUS_TONE[lead.status]} />
          <FollowUpLabel followUpAt={lead.followUpAt} now={now} />
        </div>
      </div>

      {lastNote ? <p className="line-clamp-2 text-sm text-foreground-muted">“{lastNote}”</p> : null}

      <ContactButtons phone={lead.phone} whatsapp={lead.whatsapp} />

      {lead.status !== "CONVERTED" ? (
        <details>
          <summary className="w-fit cursor-pointer text-sm font-medium text-accent">Log call</summary>
          <div className="mt-3">
            <LogCallForm coldLeadId={lead.id} currentStatus={lead.status} />
          </div>
        </details>
      ) : null}
    </li>
  );
}
