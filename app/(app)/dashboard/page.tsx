import { requireEmployee, isAdmin } from "@/lib/auth";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";

export default async function DashboardPage() {
  const employee = await requireEmployee();
  const firstName = employee.fullName.split(" ")[0];

  if (isAdmin(employee.role)) {
    return <AdminDashboard firstName={firstName} />;
  }

  return <EmployeeDashboard employeeId={employee.id} firstName={firstName} />;
}
