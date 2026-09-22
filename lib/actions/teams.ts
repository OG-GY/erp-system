"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const teamFieldsSchema = z.object({
  name: z.string().min(1, "Enter a team name.").max(200),
  description: z.string().max(2000).optional(),
});

export type CreateTeamState = { error: string | null };

export async function createTeam(
  _prevState: CreateTeamState,
  formData: FormData,
): Promise<CreateTeamState> {
  await requireAdmin();

  const parsed = teamFieldsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }

  let team;
  try {
    team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "A team with this name already exists." };
    }
    throw err;
  }

  revalidatePath("/teams");
  redirect(`/teams/${team.id}`);
}

export type UpdateTeamState = { error: string | null; success: boolean };

export async function updateTeam(
  teamId: string,
  _prevState: UpdateTeamState,
  formData: FormData,
): Promise<UpdateTeamState> {
  await requireAdmin();

  const parsed = teamFieldsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the fields.",
      success: false,
    };
  }

  try {
    await prisma.team.update({
      where: { id: teamId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "A team with this name already exists.", success: false };
    }
    throw err;
  }

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);
  return { error: null, success: true };
}

export type DeleteTeamState = { error: string | null };

export async function deleteTeam(teamId: string): Promise<DeleteTeamState> {
  await requireAdmin();

  await prisma.$transaction([
    prisma.teamMembership.deleteMany({ where: { teamId } }),
    prisma.team.delete({ where: { id: teamId } }),
  ]);

  revalidatePath("/teams");
  redirect("/teams");
}

const addMemberSchema = z.object({
  employeeId: z.string().min(1, "Select an employee."),
  role: z.string().max(100).optional(),
});

export async function addTeamMember(teamId: string, formData: FormData) {
  await requireAdmin();

  const parsed = addMemberSchema.safeParse({
    employeeId: formData.get("employeeId"),
    role: formData.get("role") || undefined,
  });
  if (!parsed.success) return;

  try {
    await prisma.teamMembership.create({
      data: {
        teamId,
        employeeId: parsed.data.employeeId,
        role: parsed.data.role || "Member",
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return; // already a member — no-op
    }
    throw err;
  }

  revalidatePath(`/teams/${teamId}`);
}

export async function removeTeamMember(teamId: string, membershipId: string) {
  await requireAdmin();
  await prisma.teamMembership.delete({ where: { id: membershipId } });
  revalidatePath(`/teams/${teamId}`);
}

const updateRoleSchema = z.object({
  role: z.string().min(1, "Enter a role.").max(100),
});

export type UpdateMemberRoleState = { error: string | null; success: boolean };

export async function updateTeamMemberRole(
  teamId: string,
  membershipId: string,
  _prevState: UpdateMemberRoleState,
  formData: FormData,
): Promise<UpdateMemberRoleState> {
  await requireAdmin();

  const parsed = updateRoleSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a role.",
      success: false,
    };
  }

  await prisma.teamMembership.update({
    where: { id: membershipId },
    data: { role: parsed.data.role },
  });

  revalidatePath(`/teams/${teamId}`);
  return { error: null, success: true };
}
