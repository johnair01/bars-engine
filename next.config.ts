import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse-new"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  // Legacy /hand route renamed to /vault (see .specify/specs/hand-vault-rename).
  // 301-redirect old links/bookmarks, preserving sub-paths and query params.
  async redirects() {
    return [
      { source: "/hand", destination: "/vault", permanent: true },
      { source: "/hand/:path*", destination: "/vault/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
