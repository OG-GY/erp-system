"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions/leads";
import { Select } from "@/components/ui/Select";

// Same names as the board columns.
const OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "READY_TO_CALL", label: "Ready to call" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "MEETING_BOOKED", label: "Meeting booked" },
  { value: "PROPOSAL_SENT", label: "Proposal sent" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
  { value: "DISQUALIFIED", label: "Disqualified" },
];

// Lost/Disqualified need a reason, which only the lead's page collects —
// same rule as dropping a card on those board columns.
const REASON_REQUIRED_STATUSES = new Set(["LOST", "DISQUALIFIED"]);

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    setValue(status);
  }
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    if (next === value) return;
    if (REASON_REQUIRED_STATUSES.has(next)) {
      router.push(`/leads/${leadId}`);
      return;
    }
    setValue(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("status", next);
      await updateLeadStatus(leadId, { error: null }, fd);
      router.refresh();
    });
  }

  return (
    <Select
      aria-label="Lead status"
      value={value}
      onChange={handleChange}
      disabled={isPending}
      className="w-40"
      options={OPTIONS}
    />
  );
}
