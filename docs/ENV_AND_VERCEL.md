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
- **What to set**: At minimum, `DATABASE_URL` (PostgreSQL connection string) and `OPENAI_API_KEY` if you use AI features. Set them for the environments you use (Production, Preview, and optionally Development if you use a separate dev database).
- **Sync**: Production and Preview deployments use these values. Local dev uses whatever you pulled with `vercel env pull .env.local` or put in `.env`.
- **Env scope**: Vercel lets you set different values per environment — **Production**, **Preview**, and **Development**. Each can have a different `DATABASE_URL`. If prod and local use different URLs, they hit different databases.

No secrets or real URLs belong in the repo; only this doc and `.env.example` (with placeholders).

---

## Production vs local: which database?

If production cannot log in or sign up while local dev has data, production and local are likely using **different databases**.

- **Local**: Uses `.env.local` (from `vercel env pull`) or `.env`. Run `grep DATABASE_URL .env.local` to see what local uses.
- **Production**: Uses env vars from Vercel Dashboard → Settings → Environment Variables, scoped to **Production**.
- **To compare**: Check the host in each URL (without logging the full secret). If they differ, prod and local hit different DBs. Production DB may be empty or never seeded.

---

## Troubleshooting

### DATABASE_URL

If `DATABASE_URL` errors appear in build or Prisma commands (e.g. `npm run build`, `npm run db:push`), ensure you've run `npm run env:pull` (or have `.env` with `DATABASE_URL`). The app loads `.env.local` first; all scripts now do the same.

**Build without DATABASE_URL**: `npm run build` works even when `DATABASE_URL` is not set. In that case, it skips `prisma migrate deploy` and runs `prisma generate && next build`, so you can verify the app compiles and type-checks without a database. For a full build (including migrations), set `DATABASE_URL` via `npm run env:pull` or add it to `.env.local`.

### OPENAI_API_KEY / "Incorrect API key provided"

AI features (Book analysis, I Ching quest generation) require `OPENAI_API_KEY`. If you see "Incorrect API key provided" or "OPENAI_API_KEY is not set":

1. **Local**: Add `OPENAI_API_KEY=sk-...` to `.env.local` (or `.env`). Get the key from [OpenAI API keys](https://platform.openai.com/account/api-keys).
2. **Vercel**: Add `OPENAI_API_KEY` in Vercel Dashboard → Settings → Environment Variables. Set for Production, Preview, and Development as needed. Redeploy after adding.
3. **Verify**: Run `npm run smoke` — it checks for `OPENAI_API_KEY` presence.
4. **Key format**: Valid keys start with `sk-` or `sk-proj-`. If rotated or expired, create a new key and update env.

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
