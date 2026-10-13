"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignLeadOwner } from "@/lib/actions/leads";
import { Select } from "@/components/ui/Select";

export function LeadOwnerControl({
  leadId,
  ownerId,
  callers,
}: {
  leadId: string;
  ownerId: string | null;
  callers: { id: string; fullName: string }[];
}) {
  const router = useRouter();
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
            await assignLeadOwner(leadId, next || null);
            router.refresh();
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
