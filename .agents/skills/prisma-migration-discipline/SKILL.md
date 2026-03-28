# Skill: Prisma migration discipline

Use when **`prisma/schema.prisma` changes**, when a spec mentions **new tables/columns/enums**, or when the user asks about **db:sync vs migrate vs push**.

## Mental model

| Thing | What it is |
|-------|------------|
| **Migration SQL** (in `prisma/migrations/`) | The **contract** with production and other machines. Vercel runs `prisma migrate deploy` — it only applies **files in git**. |
| **`npm run db:sync`** | Always **regenerates Prisma Client**. In **dev**, if the schema hash changed, it may run **`db push`** (fast local alignment) and prints warnings about migrations. In **production-like env**, it **skips push** on purpose. |
| **`prisma migrate dev`** | Creates a **new migration folder + SQL**, applies it to **your local** DB, regenerates client. **Use this before committing** schema changes that ship. |
| **`prisma migrate deploy`** | Applies **pending committed migrations** — use on **staging/production** (and in CI/deploy hooks). |
| **`prisma db push`** | “Make this DB match schema **now**” — fine for **throwaway local** DBs; **do not** treat it as a substitute for a migration file when the change ships. |

## Agent / steward ritual (low grief)

1. After editing `schema.prisma`, run **`npm run db:sync`** (generates client; local DB may update — read the script output).
2. **Before any commit that ships the schema:** run **`npx prisma migrate dev --name describe_change`** so a **migration file** exists and is committed **with** the schema edit.
3. **Read the new `migration.sql`** once: prefer `ADD` / safe defaults; pause on `DROP`, `TRUNCATE`, or lossy `ALTER`.
4. **Production:** rely on **`prisma migrate deploy`** (or your host’s equivalent), not `db push`.

## Spec kit propagation

- New specs that add persistence should include **§ Persisted data & Prisma** (see `.specify/spec-template.md`).
- **`tasks.md`** should list an explicit task: *Add Prisma migration + run migrate dev; commit SQL with schema.*

## Panic reduction

- **`db:sync` skipping push** on prod-like env is **protective**, not broken.
- **Empty feeling after “sync”** usually means: client regenerated but **no migration file** — fix with **`migrate dev`**, not repeated push.

## References

- `.cursor/rules/fail-fix-workflow.mdc`
- `scripts/db-sync.ts`
- `docs/ENV_AND_VERCEL.md` (DATABASE_URL, deploy)
