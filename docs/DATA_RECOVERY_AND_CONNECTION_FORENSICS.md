# Data Recovery & Connection Forensics

When player data is lost, use this guide to (1) attempt recovery and (2) understand how the app was connecting before the incident.

---

## Part 1: Data Recovery

### Step 1 — Identify your database provider

Run `npm run diagnose:db` and note the **Database identity** (host / database name).

| Host pattern | Provider | Recovery options |
|--------------|----------|------------------|
| `*.neon.tech`, `pooler.neon.tech` | **Neon** | Point-in-time restore (7–30 days retention) |
| `db.prisma.io` | **Prisma Accelerate** | Accelerate proxies to your backing DB — check the underlying provider (often Neon) |
| `*.supabase.co` | **Supabase** | PITR on Pro plan; daily backups on free |
| `*.vercel-storage.com` | **Vercel Postgres** | Powered by Neon — use Neon console |
| Other | Check provider docs | pg_dump backups if you ran them |

### Step 2 — Neon point-in-time restore (if applicable)

If your DB is Neon (or Vercel Postgres / Prisma Accelerate backed by Neon):

1. Go to [Neon Console](https://console.neon.tech) → your project.
2. **Branches** → select your main branch → **Restore**.
3. Choose a timestamp **before** the incident (e.g. yesterday evening).
4. Restore creates a new branch; you can either:
   - Point your app at the restored branch’s connection string, or
   - Use **Time Travel Assist** to verify data, then complete the restore.

**Retention:** Default 7 days; up to 30 days if configured. Act quickly.

### Step 3 — Local backups

If you ever ran `npm run db:backup`, check:

```bash
ls -la backups/
```

Backups are saved as `backups/snapshot_<timestamp>.json`. To restore:

```bash
npx tsx scripts/db-restore.ts backups/snapshot_<timestamp>.json
```

**Note:** The restore script expects `archetypes` (not `playbooks`). If your backup predates the playbook→archetype migration, you may need to adjust.

### Step 4 — Provider backups (Supabase, etc.)

- **Supabase:** Dashboard → Database → Backups. Restore from a backup if available.
- **Other providers:** Check their dashboard for snapshots or PITR.

### Step 5 — Reseed as last resort

If recovery is not possible:

```bash
npm run db:seed
npm run seed:party
npm run seed:quest-map
npm run seed:onboarding
npm run seed:cert:cyoa
```

Or use `npm run setup` for the full sequence.

---

## Part 2: Connection Forensics — How things were connecting before

### Current resolution logic (`src/lib/db-resolve.ts`)

| Environment | Priority order |
|-------------|----------------|
| **Development** (`NODE_ENV !== 'production'`) | `DATABASE_URL` → `POSTGRES_URL` → `PRISMA_DATABASE_URL` → `POSTGRES_PRISMA_URL` |
| **Production** | `PRISMA_DATABASE_URL` → `POSTGRES_PRISMA_URL` → `DATABASE_URL` → `POSTGRES_URL` |

So:

- **Local dev** prefers direct URLs (`DATABASE_URL`) over Accelerate (`PRISMA_DATABASE_URL`).
- **Production** prefers Accelerate first.

### Historical changes (git)

| Commit | Change |
|--------|--------|
| `b6e7421` | Original: `POSTGRES_PRISMA_URL` → `PRISMA_DATABASE_URL` → `DATABASE_URL` → `POSTGRES_URL` (same for all envs) |
| `1ae7283` | Added Accelerate; same priority for all envs |
| `db-resolve.ts` (current) | Split: dev prefers `DATABASE_URL`; prod prefers `PRISMA_DATABASE_URL` |

**Implication:** If you ran `vercel env pull` and had both `DATABASE_URL` and `PRISMA_DATABASE_URL` set:

- **Before** the dev/prod split: the app used whichever came first in the old order (often `PRISMA_DATABASE_URL`).
- **After:** Local dev uses `DATABASE_URL` first. Production still uses `PRISMA_DATABASE_URL` first.

So local dev could have switched from prod DB (Accelerate) to a different DB (direct) if `DATABASE_URL` was set to something else.

### How to see what is connecting now

```bash
npm run diagnose:db
```

Output includes:

- **Env source** — which env var is used (e.g. `DATABASE_URL`, `PRISMA_DATABASE_URL`)
- **Database identity** — host and database name
- **Row counts** — `players`, `app_config`, `instances`
- **Recent reset events** — from `audit_logs`

### How to see what was connecting before (Vercel)

1. **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Check which vars exist for **Production**, **Preview**, **Development**
3. Compare with `.env.local` after `vercel env pull` — that file gets overwritten with Vercel’s values

**Important:** `vercel env pull` pulls vars for the selected environment. If Production and Development have different `DATABASE_URL` values, pulling Production vars makes local dev use the production DB.

### Common “wrong DB” scenarios

| Scenario | Result |
|----------|--------|
| `vercel env pull` with Production selected | `.env.local` gets prod vars; local dev may hit prod DB |
| `DATABASE_URL` and `PRISMA_DATABASE_URL` both set | Dev uses `DATABASE_URL`; prod uses `PRISMA_DATABASE_URL` — can be different DBs |
| New Neon/Vercel project | Fresh DB; no data until seeded |
| Prisma Accelerate | `db.prisma.io` in URL; actual DB is the one configured in Prisma Data Platform |

### Checklist: “What DB was I using before?”

1. Run `npm run diagnose:db` — note current source and identity.
2. Inspect `.env.local` (and `.env`): `grep -E 'DATABASE_URL|PRISMA_DATABASE_URL|POSTGRES' .env.local .env 2>/dev/null | sed 's/=.*/=***/'` — see which vars are set (values redacted).
3. Check Vercel env vars and which environment was used for `vercel env pull`.
4. If using Neon: Neon Console → project → connection strings for each branch.
5. If using Prisma Accelerate: Prisma Data Platform → your project → backing database URL.

---

## Quick reference

| Goal | Command |
|------|---------|
| See current DB and row counts | `npm run diagnose:db` |
| See reset history | `npm run db:reset-history` |
| Diagnose prod login issues | `DATABASE_URL="<prod-url>" npm run diagnose:prod-db` |
| Create backup | `npm run db:backup` |
| Restore from backup | `npx tsx scripts/db-restore.ts backups/snapshot_<file>.json` |
| Full reseed | `npm run setup` |
