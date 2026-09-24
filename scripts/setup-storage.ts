/**
 * One-off setup script: creates the "avatars" and "candidate-cvs" Storage
 * buckets if they don't already exist. Run once per Supabase project:
 * node scripts/setup-storage.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }

  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();
  if (listError) {
    throw new Error(`Could not list buckets: ${listError.message}`);
  }
  const existing = new Set(buckets.map((b) => b.name));

  if (existing.has("avatars")) {
    console.log("Bucket 'avatars' already exists — nothing to do.");
  } else {
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      "avatars",
      {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
      },
    );
    if (createError) {
      throw new Error(`Could not create bucket: ${createError.message}`);
    }
    console.log("Created public bucket 'avatars' (5MB limit, PNG/JPEG/WEBP).");
  }

  if (existing.has("candidate-cvs")) {
    console.log("Bucket 'candidate-cvs' already exists — nothing to do.");
  } else {
    // Private, unlike avatars — CVs are personal documents, viewed only via
    // short-lived signed URLs generated server-side for an authenticated admin.
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      "candidate-cvs",
      {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ["image/png"],
      },
    );
    if (createError) {
      throw new Error(`Could not create bucket: ${createError.message}`);
    }
    console.log("Created private bucket 'candidate-cvs' (10MB limit, PNG only).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
