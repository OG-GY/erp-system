/**
 * One-off setup script: creates the "avatars" Storage bucket if it doesn't
 * already exist. Run once per Supabase project: node scripts/setup-storage.ts
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

  if (buckets.some((b) => b.name === "avatars")) {
    console.log("Bucket 'avatars' already exists — nothing to do.");
    return;
  }

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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
