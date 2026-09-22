import { PageHeader } from "@/components/layout/PageHeader";
import { TeamCheckInTimesChart } from "@/components/teams/TeamCheckInTimesChart";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/date";
import { getTeamCheckInTimeSeries } from "@/lib/teamCheckIns";

function dateOnlyFromParam(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export default async function TeamCheckInTimesPage({
  searchParams,
}: PageProps<"/teams/check-ins">) {
  await requireAdmin();

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const today = todayDateOnly();
  const defaultStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  const params = await searchParams;
  const teamIdParam = Array.isArray(params?.teamId) ? params.teamId[0] : params?.teamId;
  const startParam = Array.isArray(params?.startDate) ? params.startDate[0] : params?.startDate;
  const endParam = Array.isArray(params?.endDate) ? params.endDate[0] : params?.endDate;

  const selectedTeamId = teamIdParam && teams.some((t) => t.id === teamIdParam)
    ? teamIdParam
    : (teams[0]?.id ?? "");
  const startDate = dateOnlyFromParam(startParam, defaultStart);
  const endDate = dateOnlyFromParam(endParam, today);

  const series = selectedTeamId
    ? await getTeamCheckInTimeSeries(selectedTeamId, startDate, endDate)
    : null;

  return (
    <>
      <PageHeader title="Check-in times" description="Per team, over a date range" />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {teams.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            No teams yet — create one from the Teams page first.
          </p>
        ) : (
          <>
            <form method="get" className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="teamId" className="text-xs font-medium text-foreground-muted">
                  Team
                </label>
                <Select
                  id="teamId"
                  name="teamId"
                  defaultValue={selectedTeamId}
                  className="w-52"
                  options={teams.map((t) => ({ value: t.id, label: t.name }))}
                />
              </div>
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
                className="h-9 rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Refresh chart
              </button>
            </form>

            {series ? (
              <TeamCheckInTimesChart members={series.members} points={series.points} />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
