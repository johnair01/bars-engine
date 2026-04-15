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

**Option A: One-command setup (recommended)**

```bash
npm run setup
```

Runs: migrate deploy → db:seed → pre-launch seeds (party, quest-map, onboarding, cert:cyoa) → loop:ready:quick. Fails fast with a clear message at first error.

**Option B: Manual steps**

```bash
npx tsx scripts/with-env.ts "prisma migrate deploy"   # Apply migrations
npm run db:seed                                       # Base data (nations, archetypes, orientation + feedback quests)
```

For full Bruised Banana / loop:ready, also run (in order):

```bash
npm run seed:party
npm run seed:quest-map
npm run seed:onboarding
npm run seed:cert:cyoa
```

If `DATABASE_URL` is missing, you'll get a clear error. Run `npm run env:pull` or add it to `.env` first.

See [docs/DB_STRATEGY.md](DB_STRATEGY.md) for migrate vs push.

**⚠️ Never use `db push` on shared or production databases.** Always create a migration file (`npx prisma migrate dev --name describe_change`) for schema changes. `db push` is for local iteration only and can cause data loss or schema drift when used against production.

---

## Schema Merge Protocol

**Schema PRs go first. Code PRs go second. Never mix them.**

When a branch introduces new Prisma models OR modifies relations between existing models:

1. **Open a schema-only PR first.** Isolate only `prisma/schema.prisma` + any new migration files. No API routes, no UI, no lib code that depends on the new types.

2. **Verify independently.** On a clean main checkout: `git checkout main && npx prisma validate && npm run db:generate && npm run check`. All must pass with zero errors.

3. **Land the schema PR.** Merge before any code that depends on the new types.

4. **Then open code PRs.** Code PRs that use new types rebase onto the updated main and compile cleanly.

**Why this matters:** A branch that adds 5 new models and 20 files of code that uses those models will fail to build on main — because the models don't exist yet. If that PR is "almost ready" and sits open for weeks, it accrues merge conflicts against a moving main. This is what happened to `feature/rpg-handbook-gpt-pipeline` (PR #34): 32,808 additions, schema deleted 10 existing models, 5 months of conflicts. The fix was a full re-architecture.

**The rule:** If `git diff main..yourbranch -- prisma/schema.prisma | grep -E "^+model|^-model"` shows any output — you have a schema PR.

**Deferred files pattern:** When porting code that depends on un-landed schema, put it in `_deferred/`. Add `_deferred` to `tsconfig.json exclude`. Move files back one at a time, each verified clean. Track deferred items in the backlog.

---

## 5. Verification — run these before you start coding

Run each command and fix any failure before proceeding.

| Command | Purpose |
|---------|---------|
| `npm run smoke` | Checks `DATABASE_URL` and database connectivity |
| `npm run check` | `prisma generate` → server-action / Prisma validate checks → **lint** → **TypeScript** (see [docs/BUILD_RELIABILITY.md](BUILD_RELIABILITY.md)) |
| `npm run build` | Next.js build. With `DATABASE_URL` set: runs migrate deploy + build. Without: skips migrate, runs generate + build (for type-check/compile verification). |
| `npm run test:quest-grammar` | Quest grammar unit tests (if applicable) |

**Server actions:** Do not use `export type { X } from '…'` in files with `"use server"` — import shared types from `src/lib/*` instead. Husky pre-commit runs `verify:build-reliability` (plus generate, type-check, validate-manifest).

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
2. Run `npx tsx scripts/with-env.ts "prisma migrate deploy"` or `npm run db:sync`. See [docs/DB_STRATEGY.md](DB_STRATEGY.md).

**More incidents:** [.specify/specs/dev-setup-anti-fragile/INCIDENTS.md](../.specify/specs/dev-setup-anti-fragile/INCIDENTS.md) — schema drift, failed migrations, missing seeds.

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

## 8. App configuration

### postSignupRedirect

Controls where new players land after signup (campaign or guided flow).

| Value | Behavior |
|-------|----------|
| `'dashboard'` (default) | Redirect to `/` or `/?focusQuest={id}`. Dashboard-first flow for new campaigns. |
| `'conclave'` | Redirect to `/conclave/onboarding`. Legacy Party flow. |

**Where**: `AppConfig.postSignupRedirect` (nullable string). When null or unset, defaults to `'dashboard'`.

**To change**: Update via admin config UI (when available) or directly in the database:
```sql
UPDATE app_config SET "postSignupRedirect" = 'conclave' WHERE id = 'singleton';
```

See [.specify/specs/dashboard-orientation-flow/spec.md](../.specify/specs/dashboard-orientation-flow/spec.md).

---

## 9. Prisma: Large-field queries (P6009)

**Prisma Accelerate** enforces a 5MB response size limit. Queries that fetch large text/binary fields (e.g. `Book.extractedText`, `CustomBar.storyContent`) can exceed this and trigger **P6009 (ResponseSizeLimitExceeded)**.

**Rule:** For list/catalog queries, use `select` to exclude large fields. Only fetch full content when loading a single record for detail/edit.

**Example:** `listBooks()` must not fetch `extractedText`. Use:
```ts
db.book.findMany({
  select: { id: true, title: true, author: true, slug: true, sourcePdfUrl: true, status: true, metadataJson: true, createdAt: true, thread: { select: { id: true } } },
  orderBy: { createdAt: 'desc' },
})
```

See [.specify/specs/prisma-p6009-response-size-fix/spec.md](../.specify/specs/prisma-p6009-response-size-fix/spec.md) and `src/lib/prisma-errors.ts` for `isPrismaP6009()`.

---

## Agent skills (AI-assisted development)

When using Cursor or other AI agents, project skills in `.agents/skills/` guide implementation:

| Skill | Purpose |
|-------|---------|
| [Deftness Development](../.agents/skills/deftness-development/SKILL.md) | Spec kit discipline, API-first design, scaling robustness; reduces rework and token cost |
| [Spec Kit Translator](../.agents/skills/spec-kit-translator/SKILL.md) | Natural language → spec/plan/tasks |
| [Roadblock Metabolism](../.agents/skills/roadblock-metabolism/SKILL.md) | Verify imports, directives; fix build errors before commit |
| [Narrative Quality](../.agents/skills/narrative-quality/SKILL.md) | Learn from admin feedback; improve quest prose via .feedback/narrative_quality.jsonl |

---

## Quick reference

| Doc | Purpose |
|-----|---------|
| [README.md](../README.md) | Getting started, architecture |
| [ENV_AND_VERCEL.md](ENV_AND_VERCEL.md) | Environment variables, Vercel |
| §8 above | App config (postSignupRedirect) |
| [dev-notes.md](dev-notes.md) | Crash prevention, recommended workflow |
| [skills/debugging/known-failure-modes.md](skills/debugging/known-failure-modes.md) | Bug patterns and fixes |
| [NARRATIVE_QUALITY_FEEDBACK.md](NARRATIVE_QUALITY_FEEDBACK.md) | Narrative quality feedback flow, schema, skill usage |
