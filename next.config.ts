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
      // Vanity short-link (printed/QR): retired from the Bruised Banana residency,
      // now points at the MTGOA launch. Temporary (307) so the target can move again.
      { source: "/200", destination: "/launch", permanent: false },
    ];
  },
};

export default nextConfig;
