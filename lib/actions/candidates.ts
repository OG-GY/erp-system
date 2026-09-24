"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const CV_BUCKET = "candidate-cvs";
const MAX_CV_BYTES = 10 * 1024 * 1024;

/**
 * Same as avatar.ts's detectImageType: identify the image from its actual
 * bytes (magic numbers), not the client-supplied MIME type — an upload is
 * hostile input, and a spoofed `Content-Type` shouldn't be trusted.
 */
function detectImageType(
  bytes: Uint8Array,
): { mime: string; extension: string } | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mime: "image/png", extension: "png" };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

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

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { cvPath: true },
  });

  await prisma.$transaction([
    prisma.interviewNote.deleteMany({ where: { candidateId } }),
    prisma.candidate.delete({ where: { id: candidateId } }),
  ]);

  if (candidate?.cvPath) {
    await createAdminClient().storage.from(CV_BUCKET).remove([candidate.cvPath]);
  }

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

export type UploadCandidateCvState = { error: string | null };

/**
 * Replaces the candidate's CV image. The old file (if any) is hard-deleted
 * from storage, not just unlinked — there's no soft-delete/trash for these.
 */
export async function uploadCandidateCv(
  candidateId: string,
  _prevState: UploadCandidateCvState,
  formData: FormData,
): Promise<UploadCandidateCvState> {
  await requireAdmin();

  const file = formData.get("cv");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose or paste an image." };
  }
  if (file.size > MAX_CV_BYTES) {
    return { error: "Image must be 10MB or smaller." };
  }

  const buffer = await file.arrayBuffer();
  const detected = detectImageType(new Uint8Array(buffer.slice(0, 12)));
  if (!detected) {
    return { error: "Only PNG, JPEG, or WEBP images are allowed." };
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { cvPath: true },
  });
  if (!candidate) {
    return { error: "Candidate not found." };
  }

  const supabaseAdmin = createAdminClient();
  const path = `${candidateId}/${randomUUID()}.${detected.extension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(CV_BUCKET)
    .upload(path, buffer, { contentType: detected.mime, upsert: false });
  if (uploadError) {
    return { error: "Upload failed. Please try again." };
  }

  await prisma.candidate.update({ where: { id: candidateId }, data: { cvPath: path } });

  if (candidate.cvPath) {
    await supabaseAdmin.storage.from(CV_BUCKET).remove([candidate.cvPath]);
  }

  revalidatePath("/interviews");
  revalidatePath(`/interviews/${candidateId}`);
  return { error: null };
}

export async function deleteCandidateCv(candidateId: string) {
  await requireAdmin();

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { cvPath: true },
  });
  if (!candidate?.cvPath) return;

  await prisma.candidate.update({ where: { id: candidateId }, data: { cvPath: null } });
  await createAdminClient().storage.from(CV_BUCKET).remove([candidate.cvPath]);

  revalidatePath("/interviews");
  revalidatePath(`/interviews/${candidateId}`);
}
