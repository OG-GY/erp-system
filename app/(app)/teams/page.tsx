import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MyTeamsList } from "@/components/teams/MyTeamsList";
import { requireEmployee, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeamsPage() {
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
            <Link
              href="/teams/new"
              className="flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              New team
            </Link>
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

  return (
    <>
      <PageHeader title="Teams" description="Teams you're part of" />
      <div className="p-4 sm:p-6">
        <MyTeamsList teams={teams} />
      </div>
    </>
  );
}
