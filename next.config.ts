import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  experimental: {
    serverActions: {
      // Default is 1MB. The lead CSV importer calls a Server Action directly
      // with up to 1000 rows of mapped fields (notes/onlinePresence/
      // identifiedNeeds alone allow up to 4000+2000+2000 chars each) — a
      // worst-case 500-row batch can reach several MB as JSON.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
