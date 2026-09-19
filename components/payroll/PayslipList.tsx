import { StatusBadge } from "@/components/ui/StatusBadge";

const STATUS_TONE = {
  DRAFT: "neutral",
  APPROVED: "warning",
  PAID: "success",
} as const;

const STATUS_LABEL = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  PAID: "Paid",
} as const;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

type Payslip = {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  netSalary: number;
  status: keyof typeof STATUS_LABEL;
  employee?: { fullName: string };
};

export function PayslipList({ payslips }: { payslips: Payslip[] }) {
  if (payslips.length === 0) {
    return <p className="text-sm text-foreground-muted">No payslips yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-foreground-muted">
            {payslips[0]?.employee ? (
              <th className="px-4 py-2 font-medium">Employee</th>
            ) : null}
            <th className="px-4 py-2 font-medium">Period</th>
            <th className="px-4 py-2 font-medium">Net salary</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {payslips.map((payslip) => (
            <tr key={payslip.id} className="border-b border-border last:border-0">
              {payslip.employee ? (
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {payslip.employee.fullName}
                </td>
              ) : null}
              <td className="px-4 py-2.5 text-foreground-muted">
                {formatDate(payslip.periodStart)} – {formatDate(payslip.periodEnd)}
              </td>
              <td className="px-4 py-2.5 text-foreground">
                {formatCurrency(payslip.netSalary)}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge
                  label={STATUS_LABEL[payslip.status]}
                  tone={STATUS_TONE[payslip.status]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
