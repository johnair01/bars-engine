# Tasks: Integral Axes — Allyship Domain inner/outer

Implement per [spec.md](./spec.md) / [plan.md](./plan.md). Run `npm run check` after each phase (fail-fix).

## Phase 1 — Ontology / docs
- [ ] **T1**: `FOUNDATIONS.md` — add the 8-cell board table (domain × inner/outer) + inner = left-hand / outer = right-hand (incl. allyship) definition; note moves = inner column. (FR1) *(Wilber crossover + faces↔altitude tables already added.)*
- [ ] **T2**: `.specify/memory/conceptual-model.md` — add `AllyshipAspect`, the domain×aspect board, and the three-axes (horizontal/altitudinal/board) table. (FR2)

## Phase 2 — Domain inner/outer (low-risk, shippable alone)
- [ ] **T3**: `src/lib/quest-grammar/types.ts` — add `AllyshipAspect` and `MoveCellAffinity` (no `altitude` field). (FR3)
- [ ] **T4**: `src/lib/quest-grammar/canonical-kernel.ts` — replace `WAVE_TO_DOMAIN` with `MOVE_CELL_AFFINITY` (exhaustive over `PersonalMoveType`; `growUp` → Gather Resource inner). (FR4)
- [ ] **T5**: `canonical-kernel.ts` — add `export function moveDomain(move): string`; refactor `pickExperienceForPlayer` to derive from affinity, keeping signature + return type identical. (FR4)
- [ ] **T6**: Grep-audit `WAVE_TO_DOMAIN` readers (expected: only `pickExperienceForPlayer`); migrate any stragglers. (FR5)
- [ ] **T7**: `npm run check` green; spot-verify Q1 strings per move×element are coherent. (FR6)
- [ ] **T8**: Commit + push Phase 1–2 (`fail-fix-workflow`).

## Phase 3 — Persistence (separate gated slice; full Prisma discipline)
- [ ] **T9**: `prisma/schema.prisma` — add `allyshipDomainAspect String?` to `CustomBar` (+ mirror on `Instance`). (FR7)
- [ ] **T10**: `npx prisma migrate dev --name add_allyship_aspect`; commit `prisma/migrations/…` with `schema.prisma`.
- [ ] **T11**: `npm run db:sync`; then `migrate deploy`; then `npm run db:record-schema-hash` (per `docs/PRISMA_MIGRATE_STRATEGY.md`).
- [ ] **T12**: `npm run check` green; commit + push.

## Phase 4 — UI + Verification Quest (future, when surfaces land)
- [ ] **T13**: When inner/outer UI ships, add Verification Quest `cert-integral-axes-v1` (Twine + idempotent seed, per `cyoa-certification-quests`), framed toward the Bruised Banana Fundraiser. **Required before marking any UI feature complete.**

## Notes
- Phases 1–2 are independently shippable and carry no gameplay risk.
- Energy direction×volume is a **sibling spec** ([`energy-direction-volume`](../energy-direction-volume/tasks.md)).
- Do **not** start Phase 3 without the migration steps (T10–T11).
- `packages/bars-core` parity is out of scope (pre-fifth-move copy).
- **Live frontier (not a task):** the outer/allyship column has no move grammar yet — see spec Open Question §1.
</content>
