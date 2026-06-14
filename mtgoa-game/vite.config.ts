import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
//
// Embedded deploy (option 2): this Vite SPA is built into the Next.js app's
// `public/game/` so it ships with the same Vercel deploy and is reachable at
// `/game/` (deep link: `/game/#applied`). `/play` is intentionally NOT used —
// it is an existing Next route (the Charge → Scene Atlas → I Ching loop, see
// play-public-teaser-loop spec) and would shadow this static bundle. `base`
// makes the bundle load assets from `/game/...`; `outDir` writes into Next
// `public/`. Both are env-overridable for standalone hosting at the root.
const base = process.env.VITE_BASE_PATH ?? "/game/";
const outDir =
  process.env.VITE_OUT_DIR ?? path.resolve(__dirname, "../public/game");

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
  },
});
