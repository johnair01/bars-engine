# Build reliability (Next + Prisma + server actions)

Implements the playbook from [`.specify/specs/build-reliability/STRAND_CONSULT.md`](../.specify/specs/build-reliability/STRAND_CONSULT.md).

## Rituals

| Command | What it does |
|---------|----------------|
| `npm run verify:server-action-types` | Forbids `export type { … }` / `export { type X }` in files with `"use server"` (Turbopack / server-action barrel issue). |
| `npm run verify:prisma-schema` | Runs `prisma validate` (uses placeholder `DATABASE_URL` if unset). |
| `npm run verify:build-reliability` | Both checks above. |
| `npm run check` | `prisma generate` → verify → `eslint` → `tsc --noEmit`. |

**Pre-commit** (husky): `db:generate` → `verify:build-reliability` → `build:type-check` → `validate-manifest`.

**CI**: `.github/workflows/frontend-check.yml` runs `npm run check` on push/PR.

## Rules for contributors

1. **Types for shared shapes** live in `src/lib/*-types.ts` (or similar). **Do not** add `export type { Foo } from '…'` at the bottom of `"use server"` modules — import from `@/lib/...` in clients instead.
2. **Schema edits:** run `npm run db:sync` locally when you change `prisma/schema.prisma`; commit migrations when shipping DB changes.
3. **`//` comments** inside Prisma `model` blocks — avoid `/** */` between fields (parser issues on some Prisma versions).

## Live strand (optional)

```bash
npm run strand:consult:build-reliability
```

Requires backend + `OPENAI_API_KEY`; writes `.specify/specs/build-reliability/STRAND_CONSULT_LIVE.md`.
