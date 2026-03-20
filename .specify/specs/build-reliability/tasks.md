# Tasks: Build reliability (strand implementation)

- [x] `verify:server-action-types` — forbid `export type { … }` / `export { type X }` in `"use server"` files
- [x] `verify:prisma-schema` — `prisma validate` with optional placeholder `DATABASE_URL`
- [x] `verify:build-reliability` — runs both
- [x] `npm run check` — `db:generate` → verify → lint → tsc
- [x] Husky pre-commit — generate + verify + type-check + validate-manifest
- [x] CI — `.github/workflows/frontend-check.yml`
- [x] Docs — `docs/BUILD_RELIABILITY.md`, onboarding link
- [x] Remove `export type { KotterStage }` from `src/actions/stage.ts`

## Deferred (optional)

- [ ] ESLint rule mirroring `verify-server-action-types` for editor inline feedback
- [ ] CI job that applies migrations against ephemeral Postgres (heavier than `validate`)
