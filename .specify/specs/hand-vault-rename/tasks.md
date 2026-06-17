# Tasks: Rename `/hand` → `/vault`

> Implement per [spec.md](./spec.md). Atomic refactor — keep the move + reference updates in one commit so it's easy to revert.

## Phase 1 — Audit (done during execution)

- [x] **T1.1** Count exact `/hand` route refs (boundary-aware): 209 in `src`, 6 in `scripts`, 8 in `docs`.
- [x] **T1.2** Identify false positives to PRESERVE: `/handbook` (73), `/handoff` (2).
- [x] **T1.3** Identify scope boundary: rename **route** `src/app/hand/` only. **Do NOT** rename `src/components/hand/` directory (`@/components/hand/*` imports stay).

## Phase 2 — Move + Rename

- [x] **T2.1** `git mv src/app/hand src/app/vault`.
- [x] **T2.2** Update `@/app/hand` import paths → `@/app/vault` (0 remaining).
- [x] **T2.3** Replace route literals `/hand` → `/vault` (boundary-aware), preserving `/handbook` (73), `/handoff` (2), and `@/components/hand/*` (50 intact).
- [x] **T2.4** Add 301 redirects in `next.config.ts` for `/hand` and `/hand/:path*`.

## Phase 3 — Docs + Tests

- [x] **T3.1** Update `docs/`, `FOUNDATIONS.md` route refs (README/ARCHITECTURE had none).
- [x] **T3.2** Update scripts route refs.
- [x] **T3.3** Leave `.specify/specs/*` as migration documentation (per NFR2).

## Phase 4 — Verify

- [~] **T4.1** `npm run build`: route validation + registry + bundler route resolution pass. Full build blocked by pre-existing env issues only (Postgres P3005 baseline; Google Fonts blocked by sandbox network) — not the rename.
- [x] **T4.2** `npm run check` passes — 0 errors (pre-existing warnings only); refs resolve to `app/vault`.
- [x] **T4.3** No stray `/hand` route refs remain (except redirect rules + `.specify` migration docs).
- [x] **T4.4** Tasks checked off.
