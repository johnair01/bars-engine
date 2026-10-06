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
      // The booking page was /podcasts until 2026-09-15; /podcast is the show itself.
      { source: "/podcasts", destination: "/on-your-show", permanent: true },
      { source: "/hand", destination: "/vault", permanent: true },
      { source: "/hand/:path*", destination: "/vault/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: '/understood/play', destination: '/understood-app/index.html' },
      { source: '/understood/demo', destination: '/understood-app/index.html?demo=1' },
      // Ontology Alchemy Game (built by scripts/build-ontology-game.mjs). /ontology-game/wave
      // opens it with W.A.V.E. as the opening practice for the whole session.
      { source: '/ontology-game', destination: '/ontology-game/index.html' },
      { source: '/ontology-game/wave', destination: '/ontology-game/index.html' },
      // The body map's marks over time, on their own page.
      { source: '/ontology-game/body', destination: '/ontology-game/body.html' },
    ];
  },
};

export default nextConfig;
