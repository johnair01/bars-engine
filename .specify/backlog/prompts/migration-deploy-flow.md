# Prompt: Migration deploy flow — sandbox-authored, prod-applied (+ apply drop_book_entitlement)

**Use when:** a schema change is authored in a no-DB environment (Claude Code on web, Codex app) and needs to reach production reliably — or to confirm the `drop_book_entitlement` migration from PR #107 landed.

## Context

Prisma's migration commands need a reachable Postgres: `migrate dev` needs the DB **and** a shadow DB; `migrate deploy` needs the direct prod connection. The **web and Codex sandboxes have no `DATABASE_URL` and no egress to the DB** — so any agent that tries to "run the migration" there fails. That is the recurring migration pain. The fix is **never apply migrations from a sandbox** — author there, apply on the Mac/prod.

The repo is already wired for the apply side (`scripts/build-with-env.ts` runs `prisma migrate deploy` on Vercel **Production** builds; `scripts/migrate-with-direct-url.ts` is the Mac lever). The gap is **discipline about where each step runs**, plus docs/guardrails so agents don't fight the DB from a sandbox.

Decided flow (canonical = **auto on Prod deploy + Mac as lever**):

| Step | Where | How |
|------|-------|-----|
| **Author** | web / Codex (no DB) | `prisma migrate diff --from-schema-datamodel <old> --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<ts>_name/migration.sql` → `prisma generate` → `npm run db:record-schema-hash` → `prisma validate` (dummy `DATABASE_URL`) → commit schema + migration together. **Never** `migrate dev`/`deploy` here. |
| **Apply (auto)** | Vercel **Production** deploy | `build-with-env.ts` runs `prisma migrate deploy` when `DATABASE_URL` is set and it's not a preview. Merging to `main` applies pending migrations. Preview/PR builds skip on purpose. |
| **Apply (manual lever)** | Mac | `npm run env:pull:production` → `npm run db:migrate:deploy` (picks the **direct** Postgres URL, deploys, records the hash). For pre-merge apply or recovery. |

## Prompt text

> Codify and harden the sandbox-authored / prod-applied migration flow.
> 1. **Verify** the `20260615005411_drop_book_entitlement` migration (from PR #107) is applied to Production — Vercel Production build logs (`migrate deploy`) or `npm run db:migrate:status` on the Mac. If not applied, apply it via the Mac lever (`npm run env:pull:production && npm run db:migrate:deploy`).
> 2. **Document** the flow above in `docs/PRISMA_MIGRATE_STRATEGY.md` + `docs/DB_STRATEGY.md`: the table, the DB-free `migrate diff` authoring recipe, and the rule "in web/Codex never run `migrate dev`/`migrate deploy`/`db push`."
> 3. **Guardrail** for agents: add the rule to `CLAUDE.md` (Fail-Fix / migration section) and consider a sandbox-detecting wrapper that makes `migrate dev`/`deploy` fail fast with the author-instead recipe when `DATABASE_URL` is absent (mirror the existing `db:push` hard-error wrapper).
> 4. **Confirm** Vercel **Production** build env exposes a *direct* `postgres://…:5432` URL (not only the Accelerate `prisma+postgres://` URL) so auto-apply actually runs; note the finding in `docs/ENV_AND_VERCEL.md`.

## Reference

- `scripts/build-with-env.ts` (auto-apply on prod), `scripts/migrate-with-direct-url.ts` (Mac lever)
- `docs/PRISMA_MIGRATE_STRATEGY.md`, `docs/DB_STRATEGY.md`, `docs/ENV_AND_VERCEL.md`
- Related: **MIGCI** (empty-Postgres CI gate), `.specify/specs/launch-paywall-integration/spec.md` (origin of the drop migration)
