"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Identify the image type from its actual bytes (magic numbers), not the
 * client-supplied MIME type — an upload is hostile input, and a spoofed
 * `Content-Type` shouldn't be trusted.
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

export type UploadAvatarState = { error: string | null; url: string | null };

export async function uploadAvatar(
  _prevState: UploadAvatarState,
  formData: FormData,
): Promise<UploadAvatarState> {
  const employee = await requireEmployee();

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload.", url: null };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be 5MB or smaller.", url: null };
  }

  const buffer = await file.arrayBuffer();
  const detected = detectImageType(new Uint8Array(buffer.slice(0, 12)));
  if (!detected) {
    return { error: "Only PNG, JPEG, or WEBP images are allowed.", url: null };
  }

  const path = `${employee.id}/${randomUUID()}.${detected.extension}`;
  const supabaseAdmin = createAdminClient();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, buffer, { contentType: detected.mime, upsert: false });

  if (uploadError) {
    return { error: "Upload failed. Please try again.", url: null };
  }

  const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
  const previousUrl = employee.profilePictureUrl;

  await prisma.employee.update({
    where: { id: employee.id },
    data: { profilePictureUrl: data.publicUrl },
  });

  // Best-effort cleanup of the old file — not critical if it fails.
  if (previousUrl) {
    const previousPath = previousUrl.split("/avatars/")[1];
    if (previousPath) {
      await supabaseAdmin.storage.from("avatars").remove([previousPath]);
    }
  }

  revalidatePath("/profile");
  return { error: null, url: data.publicUrl };
}
