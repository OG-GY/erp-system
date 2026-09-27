import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditTeamForm } from "@/components/teams/EditTeamForm";
import { TeamMembersPanel } from "@/components/teams/TeamMembersPanel";
import { DeleteTeamButton } from "@/components/teams/DeleteTeamButton";
import { requireEmployee, isAdmin, canManageTeam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeamDetailPage({
  params,
}: PageProps<"/teams/[id]">) {
  const employee = await requireEmployee();
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      memberships: {
        select: {
          id: true,
          role: true,
          isLead: true,
          employee: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const canManage = await canManageTeam(employee, id);
  if (!isAdmin(employee.role) && !canManage) {
    redirect("/teams");
  }

  const memberIds = new Set(team.memberships.map((m) => m.employee.id));
  const availableEmployees = canManage
    ? await prisma.employee.findMany({
        where: { id: { notIn: [...memberIds] }, employmentStatus: "ACTIVE" },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true },
        take: 500,
      })
    : [];

  return (
    <>
      <PageHeader title={team.name} description={team.description ?? undefined} />
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
        {isAdmin(employee.role) ? (
          <div className="flex flex-col gap-4 lg:col-span-1">
            <div className="rounded-lg border border-border bg-surface p-4">
              <h2 className="mb-4 text-sm font-medium text-foreground-muted">
                Edit team
              </h2>
              <EditTeamForm
                teamId={team.id}
                defaultName={team.name}
                defaultDescription={team.description ?? ""}
              />
            </div>

            <div className="rounded-lg border border-danger/30 bg-surface p-4">
              <h2 className="mb-1 text-sm font-medium text-foreground-muted">
                Danger zone
              </h2>
              <p className="mb-4 text-sm text-foreground-muted">
                Deleting a team removes everyone&apos;s membership too.
              </p>
              <DeleteTeamButton teamId={team.id} teamName={team.name} />
            </div>
          </div>
        ) : null}

        <div className={isAdmin(employee.role) ? "lg:col-span-2" : "lg:col-span-3"}>
          <TeamMembersPanel
            teamId={team.id}
            members={team.memberships.map((m) => ({
              membershipId: m.id,
              id: m.employee.id,
              fullName: m.employee.fullName,
              role: m.role,
              isLead: m.isLead,
            }))}
            availableEmployees={availableEmployees}
            canManage={canManage}
          />
        </div>
      </div>
    </>
  );
}
