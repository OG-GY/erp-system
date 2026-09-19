import { PageHeader } from "@/components/layout/PageHeader";
import { LeaveApplyForm } from "@/components/leave/LeaveApplyForm";
import { MyLeaveList } from "@/components/leave/MyLeaveList";
import { AdminLeaveApprovals } from "@/components/leave/AdminLeaveApprovals";
import { requireEmployee, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function LeavePage() {
  const employee = await requireEmployee();

  if (isAdmin(employee.role)) {
    const requests = await prisma.leaveRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        daysCount: true,
        reason: true,
        status: true,
        employee: { select: { fullName: true } },
      },
    });

    return (
      <>
        <PageHeader title="Leave" description="Review and approve requests" />
        <div className="p-6">
          <AdminLeaveApprovals
            requests={requests.map((r) => ({ ...r, daysCount: Number(r.daysCount) }))}
          />
        </div>
      </>
    );
  }

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Leave" description="Apply for leave and track your requests" />
      <div className="flex flex-col gap-6 p-6">
        <section className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground-muted">
            Apply for leave
          </h2>
          <LeaveApplyForm />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-foreground-muted">
            My requests
          </h2>
          <MyLeaveList
            requests={requests.map((r) => ({ ...r, daysCount: Number(r.daysCount) }))}
          />
        </section>
      </div>
    </>
  );
}
