"use client";

import { useState, useTransition } from "react";
import { updatePayslipStatus } from "@/lib/actions/payroll";
import { Select } from "@/components/ui/Select";
import { ErrorToast } from "@/components/ui/Toast";

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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(status: string) {
    setError(null);
    startTransition(async () => {
      const result = await updatePayslipStatus(payslipId, status);
      if (result.error) {
        setError(result.error);
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
      <ErrorToast message={error} />
    </div>
  );
}
