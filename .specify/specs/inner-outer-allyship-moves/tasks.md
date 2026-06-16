# Tasks: Inner / Outer Allyship — Move Aspect Grammar

Implement per [spec.md](./spec.md) / [plan.md](./plan.md). **Blocked on** [`integral-axes`](../integral-axes/spec.md) Phase 2 (`MoveCellAffinity.aspect`). Run `npm run check` after each phase (fail-fix).

## Phase 1 — Ontology / docs
- [x] **T1**: `FOUNDATIONS.md` — add the move × aspect matrix + inner-allyship / outer-allyship definition; cite "Mastering the Game of Allyship". (FR1)
- [x] **T2**: `.specify/memory/conceptual-model.md` — add `MoveAspect`, `AllyshipTarget`, the matrix, the aspect axis. (FR2)

## Phase 2 — Types + deterministic matrix (shippable alone)
- [x] **T3**: `src/lib/quest-grammar/types.ts` — add `MoveAspect`, `AllyshipTarget`, `EnactedMove`. (FR3)
- [x] **T4**: `src/lib/quest-grammar/move-aspect.ts` (new) — `MOVE_ASPECT_MATRIX` (exhaustive over `PersonalMoveType`), `describeMove`, `isValidEnactedMove` (outer ⇒ target required). (FR4)
- [x] **T5**: Unit tests — all 10 inner/outer phrasings + target validation (outer without target ⇒ invalid). (FR5)
- [x] **T6**: `npm run check` green; commit + push.

## Phase 3 — Quest-grammar wiring (deterministic)
- [x] **T7**: `canonical-kernel.ts` — bridge: outer aspect resolves to the **outer cell** of the move's domain (via `MoveCellAffinity`); inner → inner cell. (FR6) → `resolveMoveCell(EnactedMove)`.
- [x] **T8**: Optional face-style modulation of outer phrasing via existing overlays — read-only reuse, no new face logic. (FR7) → `describeMove(m, face?)` + `FACE_HEALTHY_REGISTER` (healthy pole only; with/for shadow left as documented seam).
- [x] **T9**: `npm run check` green; commit + push. (`61c7d1a`)

## Phase 4 — UX + persistence (later; Verification Quest required)
- [ ] **T10**: Server Action for player inner/outer choice on move-taking; define contract before UI. (FR8)
- [ ] **T11**: `prisma/schema.prisma` — `QuestMoveLog.moveAspect String?` (+ optional `allyshipTarget String?`); `npx prisma migrate dev --name add_move_aspect`; commit `prisma/migrations/…`; `npm run db:sync` → `migrate deploy` → `npm run db:record-schema-hash`. (FR8)
- [ ] **T12**: Verification Quest `cert-inner-outer-allyship-v1` (Twine + idempotent seed, per `cyoa-certification-quests`), framed toward the Bruised Banana Fundraiser (e.g. an outer Show Up that invites a guest). **Required before marking the UI feature complete.** (FR9)
- [ ] **T13**: `npm run check` + `npm run build` green; commit + push.

## Notes
- Phases 1–3 are deterministic, offline-capable, and carry no gameplay risk.
- **Community-sensitive:** outer allyship is the most public surface — review copy against the Portland AI-allergy guidance; keep the non-AI path first-class.
- Energy asymmetry (inner vs outer) is the sibling spec [`energy-direction-volume`](../energy-direction-volume/spec.md).
- Do **not** start Phase 4 persistence without the migration steps (T11).
- `packages/bars-core` parity is out of scope.
</content>
