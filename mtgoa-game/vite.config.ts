import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
//
// Embedded deploy (option 2): this Vite SPA is built into the Next.js app's
// `public/play/` so it ships with the same Vercel deploy and is reachable at
// `/play/` (deep link: `/play/#applied`). `base` makes the bundle load its
// assets from `/play/...`; `outDir` writes into the Next `public/` tree. Both
// are overridable via env for standalone hosting (e.g. a dedicated Vercel
// project) where the app is served from the root.
const base = process.env.VITE_BASE_PATH ?? "/play/";
const outDir =
  process.env.VITE_OUT_DIR ?? path.resolve(__dirname, "../public/play");

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
