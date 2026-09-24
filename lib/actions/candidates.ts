"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const candidateFieldsSchema = z.object({
  fullName: z.string().min(1, "Enter a name.").max(200),
  position: z.string().min(1, "Enter a position.").max(200),
  email: z.string().email("Enter a valid email.").max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  interviewDate: z.string().optional(),
});

function parseCandidateFields(formData: FormData) {
  return candidateFieldsSchema.safeParse({
    fullName: formData.get("fullName"),
    position: formData.get("position"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    interviewDate: formData.get("interviewDate") || undefined,
  });
}

export type CreateCandidateState = { error: string | null };

export async function createCandidate(
  _prevState: CreateCandidateState,
  formData: FormData,
): Promise<CreateCandidateState> {
  await requireAdmin();

  const parsed = parseCandidateFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }

  const candidate = await prisma.candidate.create({
    data: {
      fullName: parsed.data.fullName,
      position: parsed.data.position,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      interviewDate: parsed.data.interviewDate
        ? new Date(`${parsed.data.interviewDate}T00:00:00.000Z`)
        : null,
    },
  });

  revalidatePath("/interviews");
  redirect(`/interviews/${candidate.id}`);
}

export type UpdateCandidateState = { error: string | null; success: boolean };

export async function updateCandidate(
  candidateId: string,
  _prevState: UpdateCandidateState,
  formData: FormData,
): Promise<UpdateCandidateState> {
  await requireAdmin();

  const parsed = parseCandidateFields(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the fields.",
      success: false,
    };
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      fullName: parsed.data.fullName,
      position: parsed.data.position,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      interviewDate: parsed.data.interviewDate
        ? new Date(`${parsed.data.interviewDate}T00:00:00.000Z`)
        : null,
    },
  });

  revalidatePath("/interviews");
  revalidatePath(`/interviews/${candidateId}`);
  return { error: null, success: true };
}

export async function deleteCandidate(candidateId: string) {
  await requireAdmin();

  await prisma.$transaction([
    prisma.interviewNote.deleteMany({ where: { candidateId } }),
    prisma.candidate.delete({ where: { id: candidateId } }),
  ]);

  revalidatePath("/interviews");
  redirect("/interviews");
}

const statusSchema = z.enum([
  "APPLIED",
  "SCHEDULED",
  "IN_PROGRESS",
  "ON_HOLD",
  "APPROVED",
  "OFFER_SENT",
  "REJECTED",
]);

export async function updateCandidateStatus(candidateId: string, status: string) {
  await requireAdmin();

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error("Invalid status.");
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: parsed.data },
  });

  revalidatePath("/interviews");
  revalidatePath(`/interviews/${candidateId}`);
}

const noteSchema = z.object({
  note: z.string().min(1, "Enter a note.").max(4000),
});

export type AddInterviewNoteState = { error: string | null };

export async function addInterviewNote(
  candidateId: string,
  _prevState: AddInterviewNoteState,
  formData: FormData,
): Promise<AddInterviewNoteState> {
  const admin = await requireAdmin();

  const parsed = noteSchema.safeParse({ note: formData.get("note") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a note." };
  }

  await prisma.interviewNote.create({
    data: {
      candidateId,
      authorId: admin.id,
      note: parsed.data.note,
    },
  });

  revalidatePath(`/interviews/${candidateId}`);
  return { error: null };
}
