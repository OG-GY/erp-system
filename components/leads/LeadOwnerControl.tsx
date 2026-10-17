"use client";

import { useTransition } from "react";
import { assignLeadOwner } from "@/lib/actions/leads";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

export function LeadOwnerControl({
  leadId,
  ownerId,
  callers,
}: {
  leadId: string;
  ownerId: string | null;
  callers: { id: string; fullName: string }[];
}) {
  const { run } = useToast();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground-muted">Owner</label>
      <Select
        value={ownerId ?? ""}
        disabled={isPending}
        placeholder="Unassigned"
        aria-label="Lead owner"
        onChange={(next) => {
          startTransition(async () => {
            await run(() => assignLeadOwner(leadId, next || null));
          });
        }}
        options={[
          { value: "", label: "Unassigned" },
          ...callers.map((c) => ({ value: c.id, label: c.fullName })),
        ]}
      />
    </div>
  );
}
