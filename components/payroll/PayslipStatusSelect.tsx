"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePayslipStatus } from "@/lib/actions/payroll";
import { Select } from "@/components/ui/Select";

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
] as const;

export function PayslipStatusSelect({
  payslipId,
  currentStatus,
}: {
  payslipId: string;
  currentStatus: (typeof STATUSES)[number]["value"];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(status: string) {
    setError(null);
    startTransition(async () => {
      const result = await updatePayslipStatus(payslipId, status);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        aria-label="Payslip status"
        className="w-36"
        options={STATUSES}
      />
      {error ? (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
