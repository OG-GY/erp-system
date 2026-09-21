import { Users, CalendarClock, ListTodo } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PresentTodayCard } from "@/components/dashboard/PresentTodayCard";
import { ActiveCheckInsList } from "@/components/dashboard/ActiveCheckInsList";
import { UpcomingBirthdaysCard } from "@/components/dashboard/UpcomingBirthdaysCard";
import { prisma } from "@/lib/prisma";
import { todayDateOnly, daysUntilNextOccurrence } from "@/lib/date";

const UPCOMING_BIRTHDAY_WINDOW_DAYS = 30;

export async function AdminDashboard({ firstName }: { firstName: string }) {
  const today = todayDateOnly();

  const [totalEmployees, todayRecords, pendingLeave, openTasks, employeesWithBirthday] =
    await Promise.all([
      prisma.employee.count({ where: { employmentStatus: "ACTIVE" } }),
      prisma.attendanceRecord.findMany({
        where: { date: today, status: "PRESENT" },
        select: {
          checkIn: true,
          checkOut: true,
          employee: {
            select: { id: true, fullName: true, designation: true },
          },
        },
      }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.task.count({
        where: { status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] } },
      }),
      prisma.employee.findMany({
        where: { employmentStatus: "ACTIVE", dateOfBirth: { not: null } },
        select: { id: true, fullName: true, dateOfBirth: true },
      }),
    ]);

  const upcomingBirthdays = employeesWithBirthday
    .map((e) => ({
      id: e.id,
      fullName: e.fullName,
      dateOfBirth: e.dateOfBirth!,
      daysUntil: daysUntilNextOccurrence(e.dateOfBirth!, today),
    }))
    .filter((e) => e.daysUntil <= UPCOMING_BIRTHDAY_WINDOW_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const activeCheckIns = todayRecords
    .filter((r) => r.checkIn && !r.checkOut)
    .map((r) => ({
      id: r.employee.id,
      fullName: r.employee.fullName,
      designation: r.employee.designation,
      checkIn: r.checkIn!,
    }))
    .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${firstName}`} />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Active employees"
            value={totalEmployees}
            icon={Users}
            tone="accent"
          />
          <PresentTodayCard count={todayRecords.length} activeNow={activeCheckIns} />
          <StatCard
            label="Pending leave requests"
            value={pendingLeave}
            icon={CalendarClock}
            tone="amber"
          />
          <StatCard
            label="Open tasks"
            value={openTasks}
            icon={ListTodo}
            tone="info"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ActiveCheckInsList employees={activeCheckIns} />
          <UpcomingBirthdaysCard birthdays={upcomingBirthdays} />
        </div>
      </div>
    </>
  );
}
