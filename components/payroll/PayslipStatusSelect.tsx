"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePayslipStatus } from "@/lib/actions/payroll";

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

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value;
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
      <select
        defaultValue={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        aria-label="Payslip status"
        className="h-8 rounded-md border border-border-strong bg-surface px-2 text-xs font-medium text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
