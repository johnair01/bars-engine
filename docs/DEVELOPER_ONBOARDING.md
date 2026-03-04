# Developer Onboarding — New Machine Setup

This guide walks you through setting up the Bars Engine on a new computer. If any command fails, **fix it before moving on**. This ensures the repo works for all developers regardless of machine or environment.

---

## 1. Install Node.js and npm

The project requires **Node.js v18+** and npm (bundled with Node).

### Verify installation

```bash
node --version   # Should be v18.x or higher
npm --version    # Should be 9.x or higher
```

### If `node` or `npm` not found

**macOS (Homebrew):**
```bash
brew install node
```

**macOS/Linux (nvm — recommended for version management):**
```bash
# Install nvm: https://github.com/nvm-sh/nvm#installing-and-updating
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Restart your terminal, then:
nvm install 18
nvm use 18
```

**Direct download:** [nodejs.org](https://nodejs.org/) — choose LTS (v18 or v20). Node installs to `/usr/local/bin`. If `which node` returns nothing after installing, add to `~/.zshrc` (or `~/.bashrc`):

```bash
export PATH="/usr/local/bin:$PATH"
```

Then `source ~/.zshrc` or restart the terminal.

---

## 2. Clone and install dependencies

```bash
cd bars-engine
npm install
```

### If `npm install` fails

- **Network/proxy issues:** Ensure you can reach `registry.npmjs.org`. Try `npm config get registry`.
- **Permission errors:** Avoid `sudo npm`. Use a Node version manager (nvm) or fix npm's global directory permissions.
- **Lockfile mismatch:** If `package-lock.json` conflicts, run `npm install` again. If it persists, ask the team before deleting the lockfile.

---

## 3. Environment variables

The app needs `DATABASE_URL` (PostgreSQL) and optionally `OPENAI_API_KEY` for AI features.

**With Vercel access:**
```bash
cd bars-engine
npx vercel link          # One-time: log in, select team/project
npm run env:pull         # Creates .env.local with DATABASE_URL, etc.
```

No global Vercel install needed; `npm run env:pull` uses `npx vercel` internally.

**Without Vercel access:**
```bash
cp .env.example .env
# Edit .env and add DATABASE_URL from your team (e.g. password manager)
```

See [docs/ENV_AND_VERCEL.md](ENV_AND_VERCEL.md) for full details.

---

## 4. Database setup

```bash
npx prisma migrate dev --name init   # First-time setup
npm run db:seed                      # Seed initial data
```

If `DATABASE_URL` is missing, you'll get a clear error. Run `npm run env:pull` or add it to `.env` first.

---

## 5. Verification — run these before you start coding

Run each command and fix any failure before proceeding.

| Command | Purpose |
|---------|---------|
| `npm run smoke` | Checks `DATABASE_URL` and database connectivity |
| `npm run check` | Lint + TypeScript type-check |
| `npm run build` | Full Next.js build (includes Prisma migrate deploy) |
| `npm run test:quest-grammar` | Quest grammar unit tests (if applicable) |

### Example verification flow

```bash
npm run smoke
# ✓ DATABASE_URL is present
# ✓ Database is reachable

npm run check
# No lint or type errors

npm run build
# Build completes successfully

npm run dev
# Open http://localhost:3000 — app loads
```

---

## 6. Common failure modes and fixes

### `command not found: npm` or `command not found: node`

**Cause:** Node/npm not in PATH (new machine, new shell, or version manager not loaded).

**Fix:**
1. Install Node (see §1).
2. If using nvm/fnm: ensure your shell loads it (e.g. `source ~/.nvm/nvm.sh` in `.zshrc` or `.bashrc`).
3. Restart the terminal or run `nvm use 18` (or your project version).

---

### `ENOENT: no such file or directory, open '.../package.json'`

**Cause:** Running npm from the wrong directory (e.g. home folder instead of project root).

**Fix:**
```bash
cd bars-engine   # or cd /path/to/bars-engine
npm run build
```
Always run npm commands from the project root where `package.json` lives.

---

### `tsx: command not found` or `./node_modules/.bin/tsx` not found

**Cause:** `tsx` is a dev dependency. Either `npm install` wasn't run, or `node_modules` is incomplete.

**Fix:**
```bash
npm install
# Verify:
./node_modules/.bin/tsx --version
```

---

### `Environment variable not found: DATABASE_URL`

**Cause:** No `.env.local` or `.env` with `DATABASE_URL`.

**Fix:**
1. Run `npm run env:pull` (if you have Vercel access), or
2. Copy `.env.example` to `.env` and add `DATABASE_URL` from your team.

See [docs/ENV_AND_VERCEL.md](ENV_AND_VERCEL.md).

---

### `npm run build` fails with Prisma or migration errors

**Cause:** Schema out of sync, or `DATABASE_URL` missing.

**Fix:**
1. Ensure `DATABASE_URL` is set (`npm run smoke`).
2. Run `npm run db:sync` after pulling schema changes.

---

### `npm run check` fails (lint or type errors)

**Cause:** Code doesn't pass ESLint or TypeScript checks.

**Fix:** Address the reported errors. Fix before committing. See [docs/skills/debugging/known-failure-modes.md](skills/debugging/known-failure-modes.md) for patterns.

---

### Build works locally but fails in CI / Cursor sandbox

**Cause:** CI or sandbox may not have Node in PATH, or env vars differ.

**Fix:**
- CI: Ensure the workflow installs Node (e.g. `actions/setup-node`) and runs `npm install` before `npm run build`.
- Cursor sandbox: The sandbox may not have Node. Run `npm run build` and `npm run check` in your local terminal to verify.
- **Cursor integrated terminal:** If npm works in Terminal.app but not in Cursor's terminal, ensure you're in the project directory (`cd bars-engine`). Cursor may open in your home folder. You can also add `-l` to "Terminal › Integrated › Shell Args" so the shell loads `~/.zshrc` as a login shell.

---

## 7. Fail‑fix workflow

**Before moving on** after any implementation step:

1. Run the relevant verification commands (`npm run build`, `npm run check`, and any new test scripts).
2. If any command fails, fix the failure before proceeding.
3. Do not continue to the next task or phase until all commands succeed.

This is critical for onboarding: developers on different machines need a working baseline.

---

## Agent skills (AI-assisted development)

When using Cursor or other AI agents, project skills in `.agents/skills/` guide implementation:

| Skill | Purpose |
|-------|---------|
| [Deftness Development](../.agents/skills/deftness-development/SKILL.md) | Spec kit discipline, API-first design, scaling robustness; reduces rework and token cost |
| [Spec Kit Translator](../.agents/skills/spec-kit-translator/SKILL.md) | Natural language → spec/plan/tasks |
| [Roadblock Metabolism](../.agents/skills/roadblock-metabolism/SKILL.md) | Verify imports, directives; fix build errors before commit |

---

## Quick reference

| Doc | Purpose |
|-----|---------|
| [README.md](../README.md) | Getting started, architecture |
| [ENV_AND_VERCEL.md](ENV_AND_VERCEL.md) | Environment variables, Vercel |
| [dev-notes.md](dev-notes.md) | Crash prevention, recommended workflow |
| [skills/debugging/known-failure-modes.md](skills/debugging/known-failure-modes.md) | Bug patterns and fixes |
