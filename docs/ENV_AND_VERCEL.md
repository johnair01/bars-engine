# Environment Variables and Vercel

The app uses **Vercel** as the single source of truth for secrets (e.g. `DATABASE_URL`, `OPENAI_API_KEY`). Local development should pull from Vercel when possible so env stays in sync and no secrets live in the repo.

## If you have Vercel project access (preferred)

1. **Install Vercel CLI**  
   `npm i -g vercel` or use `npx vercel` when running commands.

2. **Link the project once**  
   In the repo root: `vercel link`  
   Follow the prompts to select the correct team and project if needed.

3. **Pull env into a local file**  
   `vercel env pull .env.local`  
   This creates or overwrites `.env.local` with the project’s environment variables (including `DATABASE_URL`). No copy-paste of URLs; no secrets in the repo; same vars as Production/Preview.

4. **Stay in sync**  
   When env vars are added or changed in the Vercel dashboard, run `vercel env pull .env.local` again.  
   You can also use the npm script: `npm run env:pull`.

Next.js loads `.env.local` automatically. Then run `npm run dev` as usual.

## If you don’t have Vercel access

1. Copy the template: `cp .env.example .env`
2. Get `DATABASE_URL` (and any other required vars) from your team lead or your team’s password manager.
3. Put the values into `.env`. Do not commit `.env`.

## Vercel dashboard

- **Where**: [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Settings** → **Environment Variables**.
- **What to set**: At minimum, `DATABASE_URL` (PostgreSQL connection string) and `OPENAI_API_KEY` if you use AI features. For BAR photo uploads and book PDFs: `BLOB_READ_WRITE_TOKEN` (from Vercel Blob store — create in Dashboard → Storage). Without it, uploads fail with FUNCTION_PAYLOAD_TOO_LARGE or fall back to local filesystem (which fails on Vercel). Set them for the environments you use (Production, Preview, and optionally Development if you use a separate dev database).
- **Optional API keys (Custom GPT / scripts):** `BOOKS_CONTEXT_API_KEY` — protects `/api/admin/books` (see [BOOKS_CONTEXT_API.md](BOOKS_CONTEXT_API.md)). **`BARS_API_KEY`** — protects BAR Forge routes (`/api/match-bar-to-quests`, `/api/bar-registry`); see [BAR_FORGE_API.md](BAR_FORGE_API.md).
- **Sync**: Production and Preview deployments use these values. Local dev uses whatever you pulled with `vercel env pull .env.local` or put in `.env`.
- **Env scope**: Vercel lets you set different values per environment — **Production**, **Preview**, and **Development**. Each can have a different `DATABASE_URL`. If prod and local use different URLs, they hit different databases.

No secrets or real URLs belong in the repo; only this doc and `.env.example` (with placeholders).

---

## Production deploy checklist

Before merging schema changes or deploying to production:

| Check | Action |
|-------|--------|
| **DATABASE_URL** | Set for **Production** scope in Vercel Dashboard → Settings → Environment Variables. |
| **Migration file** | Every schema change must have a migration file. Run `npx prisma migrate dev --name describe_change` before commit. **`prisma db push` is forbidden** (see [PRISMA_MIGRATE_STRATEGY.md](PRISMA_MIGRATE_STRATEGY.md)). |
| **Migrate deploy** | Test locally: `DATABASE_URL="<prod-url>" npx prisma migrate deploy` must succeed. If it fails, fix before merging. |
| **Diagnose first** | If prod login fails, run `DATABASE_URL="<prod>" npm run diagnose:prod-db` before applying fixes. |

**Build behavior**: When `DATABASE_URL` is set, the build runs `prisma migrate deploy` first. If it fails, the build fails — no silent fallback. This prevents deploying an app with schema mismatch (500 errors, login failures).

---

## Production vs local: which database?

If production cannot log in or sign up while local dev has data, production and local are likely using **different databases**.

- **Local**: Uses `.env.local` (from `vercel env pull`) or `.env`. Run `grep DATABASE_URL .env.local` to see what local uses.
- **Production**: Uses env vars from Vercel Dashboard → Settings → Environment Variables, scoped to **Production**.
- **To compare**: Check the host in each URL (without logging the full secret). If they differ, prod and local hit different DBs. Production DB may be empty or never seeded.

---

## Troubleshooting

### DB connection diagnostic (observe before act)

When the app shows wrong data, "table does not exist," or you're unsure which database you're using, run `npm run diagnose:db` first. It reports:
- Which env var the app uses (PRISMA_DATABASE_URL, DATABASE_URL, etc.)
- Database identity (host / database name) so you can compare to what you expect
- Whether `players` and `app_config` exist and their row counts
- How to switch to a different database (unset higher-priority vars)

**Development vs production:** In development (`npm run dev`), the app prefers `DATABASE_URL` (direct) over `PRISMA_DATABASE_URL` (Accelerate), so local dev uses the direct connection even when `vercel env pull` has both set. Production keeps Accelerate-first.

No speculation. Facts only. Compare the output to what you expect, then decide what to fix.

**Connection forensics:** To see which env vars are set and what the app would use (without connecting), run `npm run diagnose:connection`. Useful when debugging "how were things connecting before?" See `docs/DATA_RECOVERY_AND_CONNECTION_FORENSICS.md` for recovery and forensics steps.

### DATABASE_URL

If `DATABASE_URL` errors appear in build or Prisma commands (e.g. `npm run build`), ensure you've run `npm run env:pull` (or have `.env` with `DATABASE_URL`). The app loads `.env.local` first; all scripts now do the same.

**Build without DATABASE_URL**: `npm run build` works even when `DATABASE_URL` is not set. In that case, it skips `prisma migrate deploy` and runs `prisma generate && next build`, so you can verify the app compiles and type-checks without a database. For a full build (including migrations), set `DATABASE_URL` via `npm run env:pull` or add it to `.env.local`.

### OPENAI_API_KEY / "Incorrect API key provided"

AI features (Book analysis, I Ching quest generation) require `OPENAI_API_KEY`. If you see "Incorrect API key provided" or "OPENAI_API_KEY is not set":

1. **Local**: Add `OPENAI_API_KEY=sk-...` to `.env.local` (or `.env`). Get the key from [OpenAI API keys](https://platform.openai.com/account/api-keys).
2. **Vercel**: Add `OPENAI_API_KEY` in Vercel Dashboard → Settings → Environment Variables. Set for Production, Preview, and Development as needed. Redeploy after adding.
3. **Verify**: Run `npm run smoke` — it checks for `OPENAI_API_KEY` presence.
4. **Key format**: Valid keys start with `sk-` or `sk-proj-`. If rotated or expired, create a new key and update env.

### STRAND_CREATOR_PLAYER_ID (FastAPI / bars-agents)

Strand and MCP-generated BARs attach to a **dedicated agent `Player`**, not an arbitrary first user.

| Variable | Where | Meaning |
|----------|--------|---------|
| `STRAND_CREATOR_PLAYER_ID` | **Backend** `.env` / `.env.local` (loaded by `backend/app/config.py`) | Optional. If set, must equal an existing `players.id`; strand uses it as `creatorId` for new BARs. |

If **unset**, the backend looks up a player with `creatorType = agent` and name **`BARS Strand Agent`**. Seed that row with:

`npm run seed:strand-agent`

(or `npx tsx scripts/with-env.ts "npx tsx scripts/seed-strand-agent-player.ts"`).

After seeding, you may pin the id: `STRAND_CREATOR_PLAYER_ID=bars-strand-agent` (default stable id from the seed script).

### Vault inventory caps (optional)

Per [.specify/specs/vault-page-experience/spec.md](../.specify/specs/vault-page-experience/spec.md) **Phase B**, creation of private draft BARs and unplaced personal quests can be limited:

| Variable | Default | Meaning |
|----------|---------|---------|
| `VAULT_MAX_PRIVATE_DRAFTS` | `100` | Max active **private, unclaimed, non-invite** non-quest BARs per player (same filter as Vault “drafts” + charge captures). Set to `0` or a negative number to **disable** the cap. |
| `VAULT_MAX_UNPLACED_QUESTS` | `50` | Max **unplaced** personal quests (BAR/321-sourced, not in a thread). Set to `0` or negative to **disable**. |

Unset or empty env uses the default. Invalid values fall back to the default.

**Vault Compost (Phase C):** Player flow at **`/hand/compost`** — salvage lines are stored on `CompostLedger`; eligible items are private drafts and unplaced personal quests (see `src/lib/vault-queries.ts` `compostEligibleWhere`). Batch size cap is `COMPOST_MAX_SOURCES` in `src/lib/vault-compost.ts` (not env in v1).

## GitHub Codespaces

In GitHub Codespaces, run `vercel link` then `npm run env:pull` once to populate `.env.local`. If you don't have Vercel access, copy `.env.example` to `.env` and add `DATABASE_URL` from your team.

---

## Confirm you have database access

Use this checklist to confirm `DATABASE_URL` is set and the app can reach the database.

1. **Get env locally**
   - **With Vercel access:** In the repo root run `vercel link` (once), then `npm run env:pull`. This creates/overwrites `.env.local` with `DATABASE_URL` and other vars from the project.
   - **Without Vercel access:** Copy `.env.example` to `.env` and add the real `DATABASE_URL` value you received from your team (e.g. from a password manager). Do not commit `.env`.

2. **Verify env and database**
   - From the repo root run: `npm run smoke`
   - The script loads `.env.local` then `.env` and checks for `DATABASE_URL` and DB connectivity. You should see `✓ DATABASE_URL is present` and `✓ Database is reachable`.
   - If `DATABASE_URL` is reported missing, ensure `.env.local` (or `.env`) exists in the repo root and contains a line `DATABASE_URL=...`.
   - If the database is unreachable, check the URL (typos, network, firewall) or confirm you are using the same source as the Vercel project (e.g. the URL from the Vercel dashboard).

3. **Run the app**
   - `npm run dev` then open http://localhost:3000. Next.js loads `.env.local` automatically. The front page should load without `Environment variable not found: DATABASE_URL`.

If any step fails, fix it before the next. The most common cause of the front-page error is step 1 not done (no `.env.local` or `.env` with `DATABASE_URL`).

---

## Running seed scripts

Seed scripts (e.g. `npm run seed:cert:cyoa`, `npm run seed:onboarding`, `npm run db:seed`) use the database and **require `DATABASE_URL`** to be set. If you run a seed without it, the script will exit with a short message pointing here and to `npm run env:pull` / `npm run smoke`.

1. **Get env first**: Run `npm run env:pull` (if you have Vercel access) or copy `.env.example` to `.env` and add the URL from your team.
2. **Optional check**: Run `npm run smoke` to confirm `DATABASE_URL` is present and the database is reachable.
3. **Then run the seed**: e.g. `npm run seed:cert:cyoa` or `npm run seed:onboarding`.

---

## Diagnose production (read-only, before any changes)

**Run this first** when prod login/signup fails. It does NOT modify the database — it only reports schema and migration state so you can identify root cause before applying fixes.

```bash
DATABASE_URL="<your-production-url>" npm run diagnose:prod-db
```

Output includes:
- Which migrations have been applied
- Whether `players` has `archetypeId` (current) or `playbookId` (old)
- Whether `archetypes` or `playbooks` table exists
- Row counts and admin status

**If you see "Schema mismatch"**: Prod DB has old schema; run `prisma migrate deploy` against prod. The playbook→archetype migration renames columns (does not drop data).

**If schema is correct**: Issue may be missing seed data, connection, or env. Run seed and ensure-admin-local.

### P3009 / P3018: Failed migration (Vercel build)

When the Vercel build fails with `Error: P3009` ("migrate found failed migrations") or `P3018` ("relation already exists"), a migration was partially applied or is in a failed state.

**If the table already exists** (P3018 / "relation X already exists"): Mark as applied so Prisma skips it:

```bash
npx tsx scripts/with-env.ts "npx prisma migrate resolve --applied 20260311000000_add_spec_kit_backlog"
```

**If the table does not exist** (P3009 only): Mark as rolled back so Prisma will retry it:

```bash
npx tsx scripts/with-env.ts "npx prisma migrate resolve --rolled-back 20260311000000_add_spec_kit_backlog"
```

Use your production `DATABASE_URL` (from `npm run env:pull` or Vercel Dashboard). For a different migration, use its name from `diagnose:prod-db` output.

After resolving, push a commit or trigger a redeploy.

---

## Point-in-time Recovery (PITR)

If production data was lost (e.g. accidental `db:reset` against prod), Prisma Postgres PITR can restore to a previous point in time.

1. **Prisma Cloud console** → your project → **Backups**
2. Select a timestamp before the incident (e.g. "8pm March 15")
3. Click **Restore** — Prisma creates a new database from that snapshot
4. Update `DATABASE_URL` in Vercel to point to the restored database URL
5. Run `npm run db:post-restore` to fix schema drift and verify

**PITR retention:** Prisma Postgres free tier retains 7 days.

**Post-restore:** The restored DB may have schema drift (columns added via `db push` after the backup). Run `npm run db:post-restore` to apply missing columns and verify. See [docs/INCIDENTS.md](./INCIDENTS.md).

---

## Daily snapshot cron (belt-and-suspenders)

Prisma PITR is the primary backup. For extra safety, run `npm run prod:snapshot` daily. It writes row-count metadata to `backups/SNAPSHOT_LOG.md` (gitignored). Run `npm run snapshot:verify` to confirm the latest snapshot is &lt; 25 hours old.

**Local cron** (recommended for maintainers with prod access):

1. Ensure `.env.local` has production `DATABASE_URL` (or use `vercel env pull`).
2. Add to crontab (`crontab -e`):
   ```
   0 0 * * * cd /path/to/bars-engine && npm run prod:snapshot >> /tmp/prod-snapshot.log 2>&1
   ```
   Replace `/path/to/bars-engine` with your repo path. Runs daily at 00:00 UTC.

**Vercel cron:** Would require a serverless function with DB access and external storage (e.g. Vercel Blob) for snapshot output. Use local cron or GitHub Actions if you need automated runs from CI.

---

## AI Tool Credential Isolation

If you use AI-managed copies of the repo (e.g. Gemini at `~/.gemini/antigravity/bars-engine/web/`), they share the same `DATABASE_URL` and can mutate production data.

**Recommendation:** Use a separate `DATABASE_URL` for AI tool copies:

- Create a dedicated development/staging database (e.g. Prisma Postgres free tier, or local Docker)
- In the AI copy's `.env.local` (e.g. `~/.gemini/antigravity/bars-engine/web/.env.local`), set `DATABASE_URL` to that dev database instead of production
- Never commit production URLs; ensure `.env.local` is gitignored

This prevents accidental `db:reset` or schema changes from running against production.

---

## Production Demo Readiness

When production cannot log in or sign up (or admin credentials fail), run these steps against the **production** database. Get the production `DATABASE_URL` from Vercel Dashboard → Settings → Environment Variables (Production scope).

1. **Diagnose first** (read-only): `DATABASE_URL="<prod>" npm run diagnose:prod-db`

2. **Verify production DB state**
   ```bash
   DATABASE_URL="<your-production-url>" npm run verify:prod-db
   ```
   Reports row counts and whether `admin@admin.local` exists with admin role. Exit 0 = ready; non-zero = run seed and ensure-admin.

3. **Verify connectivity** (optional)
   ```bash
   DATABASE_URL="<your-production-url>" npm run smoke
   ```
   Confirms `DATABASE_URL` is present and database is reachable.

4. **Seed the database** (creates roles, nations, archetypes, bars, etc.)
   ```bash
   DATABASE_URL="<your-production-url>" npm run db:seed
   ```

5. **Ensure admin@admin.local** (canonical demo admin)
   ```bash
   DATABASE_URL="<your-production-url>" npm run ensure:admin-local
   ```
   Credentials: `admin@admin.local` / `password`. Log in at `/conclave`, then access `/admin`. Idempotent — safe to run multiple times.

6. **Optional**: Create invite links for signup flows:
   ```bash
   DATABASE_URL="<your-production-url>" npx tsx scripts/create-invite.ts <TOKEN> <MAX_USES>
   ```

**Note**: Never commit production `DATABASE_URL` to the repo. Use env vars or a secure secret manager.

---

---

## Python Backend (Game Master Agents)

The Python FastAPI backend (`backend/`) runs the Game Master agents (Architect, Sage, Shaman, etc.). Vercel does not support Python serverless, so the backend is deployed separately (Railway, Render, or Fly.io).

### Running the backend locally

From the repo root:

```bash
npm run dev:backend
```

This starts the backend at `http://localhost:8000`. The backend reads `DATABASE_URL` and `OPENAI_API_KEY` from the root `.env.local` (or `.env`). For local dev, set `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` in `.env.local` so the frontend uses the local backend instead of a deployed one.

**Run agent scripts from Cursor**: Agent scripts (sage:brief, run:parallel-feature, etc.) auto-start the backend when needed. See [docs/AGENT_WORKFLOWS.md](AGENT_WORKFLOWS.md) for run-from-Cursor flows and MCP tools.

### Frontend (Vercel)

| Env | Purpose | When to set |
|-----|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | URL of the deployed Python backend (e.g. `https://bars-backend.railway.app`) | Set for Production and Preview when backend is deployed. Omit or leave empty to use fallback (direct OpenAI or deterministic logic). |

### Backend (Railway / Render / Fly.io)

Set these in the backend service's environment:

| Env | Purpose |
|-----|---------|
| `DATABASE_URL` | Same production Postgres URL as Vercel. Backend and Next.js share the database. |
| `OPENAI_API_KEY` | Required for AI agents. Same key as Vercel. |
| `REPLICATE_API_TOKEN` | Optional. Required for sprite generation (`SPRITE_GENERATION_ENABLED=1`). Get from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens). Set in `.env.local` (local) and Vercel dashboard (production). |
| `SPRITE_GENERATION_ENABLED` | Set to `1` to activate walkable sprite generation via Replicate. Default off (stub mode). |
| `CORS_ORIGINS` | Comma-separated allowed origins. Must include your Vercel app URL(s), e.g. `https://bars-engine.vercel.app,https://bars-engine-*.vercel.app` |
| `PORT` | Injected by Railway/Render. Backend listens on this port. |

**CORS**: If the frontend gets CORS errors when calling the backend, add the exact Vercel URL (and preview URLs if needed) to `CORS_ORIGINS`.

---

## Cron Jobs

### `CRON_SECRET`

**TODO (pre-production):** This env var must be added to Vercel before cron endpoints go live.

| | |
|---|---|
| **Purpose** | Authenticates Vercel Cron (or any external scheduler) against cron API routes. |
| **Format** | Any high-entropy secret string. Generate with: `openssl rand -hex 32` |
| **Vercel** | Settings → Environment Variables → add `CRON_SECRET` for Production (and Preview if desired). |
| **Local** | Add `CRON_SECRET=<any-value>` to `.env.local` if you need to test cron routes locally. |

Cron routes check `Authorization: Bearer <CRON_SECRET>` and return `401` if it is missing or wrong.

### Configured cron endpoints

| Route | Schedule | Description |
|---|---|---|
| `/api/cron/abandon-sessions` | `0 * * * *` (hourly) | Mark orientation sessions inactive > 24 h as abandoned. |

**TODO:** Add the following to `vercel.json` (create it in the repo root if it doesn't exist yet):
```json
{
  "crons": [
    { "path": "/api/cron/abandon-sessions", "schedule": "0 * * * *" }
  ]
}
```

---

## Production recovery (after DB reset or first deploy)

Same as above; see **Production demo readiness**. The canonical admin for demos is `admin@admin.local` (from seed / `ensure-admin-local`). The `create-admin` script creates `admin@bars-engine.local` / `veritaserum` — a different account.
