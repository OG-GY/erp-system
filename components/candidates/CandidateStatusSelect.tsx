"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCandidateStatus } from "@/lib/actions/candidates";
import { Select } from "@/components/ui/Select";

const STATUS_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "OFFER_SENT", label: "Offer sent" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const;

export function CandidateStatusSelect({
  candidateId,
  status,
}: {
  candidateId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      aria-label="Candidate status"
      className="w-40"
      onChange={(next) => {
        startTransition(async () => {
          await updateCandidateStatus(candidateId, next);
          router.refresh();
        });
      }}
      options={STATUS_OPTIONS}
    />
  );
}
