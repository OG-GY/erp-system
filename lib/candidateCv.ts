import { createAdminClient } from "@/lib/supabase/admin";

const CV_BUCKET = "candidate-cvs";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * The "candidate-cvs" bucket is private, so viewing a CV means generating a
 * short-lived signed URL server-side for the currently authenticated admin
 * — never a public URL. Batches all paths into one Storage API call rather
 * than one round trip per candidate.
 */
export async function getCvSignedUrls(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();

  const { data, error } = await createAdminClient()
    .storage.from(CV_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return new Map();

  const urls = new Map<string, string>();
  for (const entry of data) {
    if (entry.path && entry.signedUrl && !entry.error) {
      urls.set(entry.path, entry.signedUrl);
    }
  }
  return urls;
}
