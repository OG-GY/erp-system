import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MyTeamsList } from "@/components/teams/MyTeamsList";
import { TeamCheckInTimesChart } from "@/components/teams/TeamCheckInTimesChart";
import { TeamCheckInsChart } from "@/components/dashboard/TeamCheckInsChart";
import { CheckInChart } from "@/components/dashboard/CheckInChart";
import { Input } from "@/components/ui/Input";
import { requireEmployee, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";
import { getTeamCheckInTimeSeries, getTeammatesCheckInsToday } from "@/lib/teamCheckIns";
import { minutesSinceMidnight } from "@/lib/format";

const PERSONAL_HISTORY_DAYS = 14;

function dateOnlyFromParam(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export default async function TeamsPage({
  searchParams,
}: PageProps<"/teams">) {
  const employee = await requireEmployee();

  if (isAdmin(employee.role)) {
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { memberships: true } } },
    });

    return (
      <>
        <PageHeader
          title="Teams"
          description={`${teams.length} ${teams.length === 1 ? "team" : "teams"}`}
          actions={
            <>
              <Link
                href="/teams/check-ins"
                className="flex h-8 items-center rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
              >
                Check-in times
              </Link>
              <Link
                href="/teams/new"
                className="flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                New team
              </Link>
            </>
          }
        />
        <div className="p-4 sm:p-6">
          {teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-sm font-medium text-foreground">No teams yet</p>
              <Link
                href="/teams/new"
                className="mt-2 flex h-9 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                New team
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-foreground-muted">
                    <th className="px-4 py-2 font-medium">Team</th>
                    <th className="px-4 py-2 font-medium">Members</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-medium">
                        <Link
                          href={`/teams/${team.id}`}
                          className="text-foreground hover:text-accent"
                        >
                          {team.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-foreground-muted">
                        {team._count.memberships}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  }

  const memberships = await prisma.teamMembership.findMany({
    where: { employeeId: employee.id },
    select: {
      role: true,
      team: {
        select: {
          id: true,
          name: true,
          description: true,
          memberships: {
            select: {
              role: true,
              employee: { select: { id: true, fullName: true } },
            },
          },
        },
      },
    },
  });

  const teams = memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    description: m.team.description,
    myRole: m.role,
    members: m.team.memberships.map((tm) => ({
      id: tm.employee.id,
      fullName: tm.employee.fullName,
      role: tm.role,
    })),
  }));

  const today = todayDateOnly();
  const defaultStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  const params = await searchParams;
  const startParam = Array.isArray(params?.startDate) ? params.startDate[0] : params?.startDate;
  const endParam = Array.isArray(params?.endDate) ? params.endDate[0] : params?.endDate;
  const startDate = dateOnlyFromParam(startParam, defaultStart);
  const endDate = dateOnlyFromParam(endParam, today);

  const DAY_MS = 24 * 60 * 60 * 1000;
  const personalRangeStart = new Date(
    today.getTime() - (PERSONAL_HISTORY_DAYS - 1) * DAY_MS,
  );

  const [checkInSeriesByTeam, teammateCheckIns, personalRecords] = await Promise.all([
    Promise.all(teams.map((team) => getTeamCheckInTimeSeries(team.id, startDate, endDate))),
    getTeammatesCheckInsToday(teams.map((t) => t.id)),
    prisma.attendanceRecord.findMany({
      where: { employeeId: employee.id, date: { gte: personalRangeStart, lte: today } },
      select: { date: true, checkIn: true },
    }),
  ]);

  const personalRecordsByDate = new Map(
    personalRecords.map((r) => [r.date.toISOString().slice(0, 10), r]),
  );
  const personalChartPoints = Array.from({ length: PERSONAL_HISTORY_DAYS }, (_, i) => {
    const date = new Date(personalRangeStart.getTime() + i * DAY_MS);
    const record = personalRecordsByDate.get(date.toISOString().slice(0, 10));
    const checkInMinutes = record?.checkIn ? minutesSinceMidnight(record.checkIn) : null;
    return { date, checkInMinutes };
  });

  return (
    <>
      <PageHeader title="Teams" description="Teams you're part of" />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <TeamCheckInsChart teammates={teammateCheckIns} />
        <CheckInChart points={personalChartPoints} />

        {teams.length > 0 ? (
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="startDate" className="text-xs font-medium text-foreground-muted">
                Start date
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={startDate.toISOString().slice(0, 10)}
                max={today.toISOString().slice(0, 10)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="endDate" className="text-xs font-medium text-foreground-muted">
                End date
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={endDate.toISOString().slice(0, 10)}
                max={today.toISOString().slice(0, 10)}
                className="w-40"
              />
            </div>
            <button
              type="submit"
              className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
            >
              Refresh chart
            </button>
          </form>
        ) : null}

        <MyTeamsList teams={teams} />

        {checkInSeriesByTeam.map((series, i) => (
          <TeamCheckInTimesChart
            key={teams[i].id}
            members={series.members}
            points={series.points}
          />
        ))}
      </div>
    </>
  );
}
