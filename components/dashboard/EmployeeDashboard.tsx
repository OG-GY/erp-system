import type { Role } from "@prisma/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { CheckInCard } from "@/components/dashboard/CheckInCard";
import { AssignedProjectsCard } from "@/components/dashboard/AssignedProjectsCard";
import { AssignedTasksCard } from "@/components/dashboard/AssignedTasksCard";
import { MyTeamsCard } from "@/components/dashboard/MyTeamsCard";
import { UpcomingBirthdaysCard } from "@/components/dashboard/UpcomingBirthdaysCard";
import { OnLeaveTodayCard } from "@/components/dashboard/OnLeaveTodayCard";
import { CallerMetricsCard } from "@/components/dashboard/CallerMetricsCard";
import { FollowUpsDueCard } from "@/components/dashboard/FollowUpsDueCard";
import { TeamCheckInTimesChart } from "@/components/teams/TeamCheckInTimesChart";
import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";
import { getUpcomingBirthdays } from "@/lib/birthdays";
import { getEmployeesOnLeaveToday } from "@/lib/leave";
import { getTeamCheckInTimeSeries } from "@/lib/teamCheckIns";
import { getCallerMetrics } from "@/lib/leadMetrics";
import { isCallCaller } from "@/lib/auth";

const CHECKIN_TREND_DAYS = 7;

export async function EmployeeDashboard({
  employeeId,
  firstName,
  role,
}: {
  employeeId: string;
  firstName: string;
  role: Role;
}) {
  const today = todayDateOnly();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Shared by every role on this dashboard — the check-in card's data.
  const openOrTodayRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      OR: [{ date: today }, { checkIn: { not: null }, checkOut: null }],
    },
    include: { breaks: true },
  });
  // An overnight shift (e.g. checked in 11pm, still running past midnight)
  // stays dated to the day it started, so once the calendar date rolls over
  // it's no longer "today's" record by date — look for a still-open shift
  // first, and only fall back to an exact date match otherwise.
  const openRecord = openOrTodayRecords.find((r) => r.checkIn && !r.checkOut);
  const todayRecord =
    openRecord ?? openOrTodayRecords.find((r) => r.date.getTime() === today.getTime());
  // Exact milliseconds, not the rounded-to-the-minute totalBreakMinutes()
  // helper — this feeds a live per-second timer, where rounding would show
  // as a visible jump.
  const completedBreakMs =
    todayRecord?.breaks.reduce((sum, b) => {
      if (!b.endedAt) return sum;
      return sum + (b.endedAt.getTime() - b.startedAt.getTime());
    }, 0) ?? 0;

  const checkInCard = (
    <CheckInCard
      checkInTime={todayRecord?.checkIn ?? null}
      checkOutTime={todayRecord?.checkOut ?? null}
      openBreakStartedAt={todayRecord?.breaks.find((b) => !b.endedAt)?.startedAt ?? null}
      completedBreakMs={completedBreakMs}
    />
  );

  // Call Caller gets a purpose-built dashboard — Projects/Tasks/Teams are
  // irrelevant to this role, so there's no reason to query or render them.
  if (isCallCaller(role)) {
    const weekStart = new Date(today.getTime() - 6 * DAY_MS);
    const [metrics, followUpsDue, upcomingBirthdays, onLeaveToday] = await Promise.all([
      getCallerMetrics(employeeId, weekStart, today),
      prisma.followUp.findMany({
        where: { assignedToId: employeeId, status: "SCHEDULED", dueDate: { lte: today } },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          dueDate: true,
          action: true,
          lead: { select: { id: true, businessName: true } },
        },
        take: 20,
      }),
      getUpcomingBirthdays(),
      getEmployeesOnLeaveToday(),
    ]);

    return (
      <>
        <PageHeader title="Dashboard" description={`Welcome back, ${firstName}`} />
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {checkInCard}
            <CallerMetricsCard metrics={metrics} />
            <FollowUpsDueCard followUps={followUpsDue} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <OnLeaveTodayCard leaveRequests={onLeaveToday} />
            <UpcomingBirthdaysCard birthdays={upcomingBirthdays} />
          </div>
        </div>
      </>
    );
  }

  const trendStart = new Date(today.getTime() - (CHECKIN_TREND_DAYS - 1) * DAY_MS);

  const [projectMembers, tasks, teamMemberships, upcomingBirthdays, onLeaveToday] =
    await Promise.all([
      prisma.projectMember.findMany({
        where: { employeeId },
        select: { project: { select: { id: true, name: true, status: true } } },
        take: 20,
      }),
      prisma.task.findMany({
        where: { assigneeId: employeeId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
        },
        take: 20,
      }),
      prisma.teamMembership.findMany({
        where: { employeeId },
        select: { role: true, team: { select: { id: true, name: true } } },
      }),
      getUpcomingBirthdays(),
      getEmployeesOnLeaveToday(),
    ]);

  // Depends on teamMemberships above, so it can't join the Promise.all.
  const checkInSeriesByTeam = await Promise.all(
    teamMemberships.map((m) => getTeamCheckInTimeSeries(m.team.id, trendStart, today)),
  );

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${firstName}`} />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {checkInCard}
          <AssignedProjectsCard
            projects={projectMembers.map((m) => m.project)}
          />
          <AssignedTasksCard tasks={tasks} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MyTeamsCard
            teams={teamMemberships.map((m) => ({
              id: m.team.id,
              name: m.team.name,
              role: m.role,
            }))}
          />
          <OnLeaveTodayCard leaveRequests={onLeaveToday} />
          <UpcomingBirthdaysCard birthdays={upcomingBirthdays} />
        </div>

        {checkInSeriesByTeam.map((series, i) => (
          <TeamCheckInTimesChart
            key={teamMemberships[i].team.id}
            members={series.members}
            points={series.points}
          />
        ))}
      </div>
    </>
  );
}
