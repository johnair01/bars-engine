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
      // The booking page was /podcasts until 2026-09-15; it now closes the podcast page.
      { source: "/podcasts", destination: "/podcast#on-your-show", permanent: true },
      { source: "/hand", destination: "/vault", permanent: true },
      { source: "/hand/:path*", destination: "/vault/:path*", permanent: true },
      // wendell.masteringallyship.com is on this Vercel project and showed the home page. Its
      // front door is now the coaching map (position cg-subdomain, content/coaching-game/
      // 6FACE_PASS1_2026-10-09.md). Temporary, so the address can move if he flips it.
      {
        source: "/",
        has: [{ type: "host", value: "wendell.masteringallyship.com" }],
        destination: "https://masteringallyship.com/coaching",
        permanent: false,
      },
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
