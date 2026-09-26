import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Keep database-backed SEO page generation below the Supabase pool limit.
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 500,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "osmlhdskgvigfprzpnrn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "staging.minaretnetwork.ca",
        pathname: "/storage/v1/object/public/**",
      },
      // Google profile avatars (OAuth sign-in)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
