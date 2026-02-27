# Prompt: Env Seed Scripts Onboarding

**Use this prompt when adding or modifying standalone scripts that use the database.**

## Prompt text

> Follow the spec in [.specify/specs/env-seed-scripts-onboarding/spec.md](../../specs/env-seed-scripts-onboarding/spec.md): any standalone script that uses the database must import `./require-db-env` first (before importing `db` or instantiating `PrismaClient`), so env is loaded from `.env.local` and `.env` and `DATABASE_URL` is checked. If missing, the script exits with a clear message pointing to [docs/ENV_AND_VERCEL.md](../../../docs/ENV_AND_VERCEL.md), `npm run env:pull`, and `npm run smoke`. Docs must state that seed scripts require `DATABASE_URL` and point to the env doc.

## Checklist when adding a new DB-using script

1. Add `import './require-db-env'` as the first import (before `import { db }` or `new PrismaClient()`).
2. Ensure [docs/ENV_AND_VERCEL.md](../../../docs/ENV_AND_VERCEL.md) "Running seed scripts" section exists and is accurate.

## Reference

- Spec: [.specify/specs/env-seed-scripts-onboarding/spec.md](../../specs/env-seed-scripts-onboarding/spec.md)
- Helper: [scripts/require-db-env.ts](../../../scripts/require-db-env.ts)
