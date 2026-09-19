import { ComingSoon } from "@/components/layout/ComingSoon";
import { requireAdmin } from "@/lib/auth";

export default async function ReportsPage() {
  await requireAdmin();
  return <ComingSoon title="Reports" />;
}
