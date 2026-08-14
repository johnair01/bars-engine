# Spec Kit Prompt: Serverless Asset Budget

## Role
You are a Spec Kit agent restoring the Vercel Function size budget and finishing the Vercel Blob migration.

## Objective
Stop `@vercel/nft` from tracing all 163MB of `public/` into every serverless function. Four
server-side sites read `public/` through a runtime-assembled path (`path.join(process.cwd(), 'public', …)`),
which static analysis cannot resolve, so tracing conservatively bundles whole directories.
Server code needs ~560KB out of `public/` and receives 163MB — about 290 bundled bytes per
byte used. A preview deploy failed at 250.04MB against the 250MB ceiling on 2026-08-13.

## Prompt (API-First)
> Implement Serverless Asset Budget per [.specify/specs/serverless-asset-budget/spec.md](../../specs/serverless-asset-budget/spec.md).
> **Phase 1 first and alone** — move `public/oracle/deck.json`, `public/registry.json`, and
> `public/allyship-deck/allyship-deck.json` into `src/data/` and `import` them literally;
> replace the `public/sprites/parts/` directory scan in `admin.ts` with a committed manifest;
> then add `outputFileTracingExcludes: { '/**': ['public/**'] }` to `next.config.ts` as a guard.
> Record the largest-function size before and after in the PR — it should fall from ~250MB to under 100MB.
> **Phase 2, separate PR**: add `putAsset(scope, key, body, opts)` in `src/lib/storage/put-asset.ts`,
> route `assets.ts` / `books.ts` / `deliverables.ts` / `admin.ts` sprite upload through it, and
> delete the silent `public/uploads` fallbacks. **Phase 3, separate PR**: migrate `public/oracle/`
> and `public/card-art/` to Blob with verification quest `cert-asset-cdn-v1`.

## Requirements
- **Surfaces**: none player-visible in Phases 1–2. Phase 3 changes where card and oracle art loads from.
- **Mechanics**: literal imports trace one file; computed paths trace whole directories.
- **Persistence**: no schema change. Phase 3 may need a one-off script to rewrite stored URLs.
- **API**: `putAsset(scope, key, body, opts): Promise<{ url: string }>` — throws when `BLOB_READ_WRITE_TOKEN` is unset, never falls back to the filesystem.
- **Env**: `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` (seatbelt, set first), `BLOB_READ_WRITE_TOKEN` — document both in `docs/ENV_AND_VERCEL.md`.
- **Verification**: build output function size; `cert-asset-cdn-v1` for Phase 3.

## Notes
- Vercel Blob is **already** the storage decision — `@vercel/blob@^2.3.1`, used across 15 files. This is a consistency job, not a provider evaluation.
- `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` is a seatbelt. Setting it does not close this spec.
- Three test files read the moved JSON via `process.cwd()` and must be repointed.

## Deliverables
- [x] spec.md / plan.md / tasks.md under `.specify/specs/serverless-asset-budget/`
- [ ] Phase 1 PR — largest function under 100MB, before/after recorded
- [ ] Phase 2 PR — `putAsset` adapter, no `public/` writes
- [ ] Phase 3 PR — bulk media on Blob + `cert-asset-cdn-v1`
- [ ] `npm run build` + `npm run check` pass on each phase
