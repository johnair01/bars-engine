/**
 * build-game.mjs — builds the standalone mtgoa-game Vite SPA into the Next.js
 * app's `public/play/` so it ships with the same Vercel deploy (option 2:
 * embedded under `/play/`, deep link `/play/#applied`).
 *
 * Why a separate step: `mtgoa-game/` is NOT part of the root npm workspaces
 * (`packages/*`), so the root install does not bring in its dependencies. This
 * installs them (prefer the lockfile via `npm ci`, fall back to `npm install`)
 * and runs the game's own `tsc -b && vite build`, which Vite writes to
 * `../public/play` (see mtgoa-game/vite.config.ts).
 *
 * Set SKIP_GAME_BUILD=1 to opt out (e.g. a fast web-only local build).
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gameDir = path.join(root, "mtgoa-game");

if (process.env.SKIP_GAME_BUILD === "1") {
  console.warn("⚠ SKIP_GAME_BUILD=1 — skipping mtgoa-game build (/play will be absent).");
  process.exit(0);
}

const run = (cmd) => execSync(cmd, { cwd: gameDir, stdio: "inherit", shell: true });

console.log("▶ Building mtgoa-game into public/play …");
try {
  // Prefer a clean, lockfile-pinned install; fall back if no lockfile present.
  const hasLock = existsSync(path.join(gameDir, "package-lock.json"));
  const alreadyInstalled = existsSync(path.join(gameDir, "node_modules"));
  if (hasLock) {
    run("npm ci");
  } else if (!alreadyInstalled) {
    run("npm install");
  }
  run("npm run build");
  console.log("✓ mtgoa-game built → public/play");
} catch (err) {
  console.error("");
  console.error("❌ mtgoa-game build failed — /play will be missing from this deploy.");
  console.error("   Local repro: cd mtgoa-game && npm ci && npm run build");
  console.error("   To unblock a web-only build temporarily: SKIP_GAME_BUILD=1 npm run build");
  console.error("");
  process.exit(1);
}
