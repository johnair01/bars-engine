import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse-new"],
  // Build inputs no server code reads: the Blender studio's tools, its concept pictures and the committed models (the
  // page loads its copies from public/). File tracing pulled them into every function, and api/321/ingest crossed
  // Vercel's 250 MB limit by 0.02 MB when the cave studio added them (bars-engine PR #285).
  // The 321 ingest route also reads files by a computed path, so the build traced public/ (161 MB of art and game builds) into
  // its function on 12 October 2026. It reads only from the Library folder outside the project.
  outputFileTracingExcludes: {
    // public/ontology-game holds the built game pages, which the browser loads and no server code reads. Vercel bundles
    // routes into shared functions, and the one it names api/guidance traced them and crossed the same limit by 0.02 MB
    // when the Big Mind cave joined the cave page (bars-engine PR #313).
    "*": [
      "./tools/**",
      "./content/ontology-game/cave/pictures/**",
      "./content/ontology-game/**/*.glb",
      "./public/ontology-game/**",
      // The Between's page and models (7 MB of .glb), loaded only by the browser. The first preview of bars-engine
      // PR #357 pushed api/guidance to 254.91 MB without this line.
      "./public/between/**",
      // Chapter 1's arrival aboard the ship and its models, loaded only by the browser.
      "./public/calrunia/**",
    ],
    "/api/321/ingest": ["./public/**/*", "./content/**/*", "./docs/**/*", "./.specify/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  // Tap the Vein's embed is framed only by the Council Board on this same site (/board/council).
  async headers() {
    return [{ source: "/tap-the-vein/embed", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] }];
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
      // The Cave of Lessons: the block work walked inside the body map.
      { source: '/ontology-game/cave', destination: '/ontology-game/cave/index.html' },
      // Chapter 1's arrival aboard the ship (scripts/build-calrunia-arrive.mjs). The passport rides in the #p= fragment.
      { source: '/calrunia/arrive', destination: '/calrunia/arrive/index.html' },
    ];
  },
};

export default nextConfig;
