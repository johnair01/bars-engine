import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deckRoot = path.resolve(__dirname, "..");

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      "@oracle": path.join(deckRoot, "routes", "oracle.tsx"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [deckRoot],
    },
    proxy: {
      "/api": "http://127.0.0.1:3099",
      "/images": "http://127.0.0.1:3099",
    },
  },
});
