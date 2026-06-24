# Tasks: Allyship Technique Vocabulary

Implement in order. Phases 1–2 are pure TS (no DB, no UI). Phase 3 is persistence and is gated on a real need for community/personal techniques.

> **Status (2026-06-20):** Phases 1 & 2 implemented on `claude/admiring-shannon-wlddtw`. 66 unit tests pass; `tsc --noEmit` clean (0 project errors); eslint clean. Full `npm run check` not run here (its `db:generate` step needs a database in this container) — verified via `tsc` + `vitest` + `eslint` directly.
>
> **Coverage:** 100% — all 120 move cards resolve ≥1 technique. Pool = 42 canonical techniques: 12 Tier-1 alchemy substrate (`canonical.ts`, MTGOA Part VI) + 30 operation-scoped practices mined from the chapter manuscript (`canonical-operations.ts`, ch1–7 = the six mentor-worlds/Operations). The 30 operation techniques closed the earlier Grow Up (0%) and Show Up (63%) gaps. Per-move now 24/24 across wake/open/clean/grow/show.

## Phase 1 — Vocabulary module + resolver (TS only)

- [x] **T1** Create `src/lib/technique-library/vocabulary.ts`:
  - Re-export `BasicMove, Operation, AllyshipDomain, Channel, Capability, OutputBar, Subject` from `@/lib/allyship-deck/types`.
  - Re-export `MoveAspect, AllyshipTarget` from `@/lib/quest-grammar/types`.
  - Define `Superpower` (`strategist | connector | escape_artist | disruptor | alchemist | storyteller`) and `Loadout { inner; outer }`.
  - Implement `emotionForChannel`, `satisfactionForChannel`, `channelsForCapabilities` backed by `CAPABILITIES` in `src/lib/allyship-deck/move-library.ts` (import the table; do not re-hardcode).
- [x] **T2** Create `src/lib/technique-library/types.ts`: `Technique`, `TechniqueSource`, `TechniqueTier`, `TechniqueAspect`, `TechniqueOrigin`, `ResolvedTechnique` per spec § API Contracts.
- [x] **T3** Create `src/lib/technique-library/resolve.ts`: `resolveTechniques(card, loadout, subject, pool, limit?)` implementing the 6-condition predicate (empty array = wildcard), `viaSlot` tagging, and specificity→tier ranking (stable sort).
- [x] **T4** Create `src/lib/technique-library/validate.ts`: `validateTechnique(t)` — enum membership checks + provenance gate (imports require `source.lineage` + `source.permission` + `ontologicalFooting`; personal/player require only minimal fields). Returns `{ ok: true } | { ok: false; errors: string[] }`.
- [x] **T5** Create `src/lib/technique-library/index.ts` barrel.
- [x] **T6** Tests `src/lib/technique-library/__tests__/`:
  - `vocabulary-no-drift.test.ts` — assert re-exported types are identical to source (assignability both directions).
  - `resolve.test.ts` — each predicate condition; aspect/subject swap (self→inner, other→outer); substrate eligibility via `alchemist`; ranking order; `limit`.
  - `validate.test.ts` — provenance gate passes/fails as specified.
- [x] **T7** Run `npm run check` — fail-fix until clean.

## Phase 2 — Canonical seed + coverage report (data only)

- [x] **T8** Create `src/lib/technique-library/canonical.ts`: seed the Tier-1 MTGOA tools as `tier: 'canonical'` `Technique`s with correct `source` (origin `'book'`, name "Mastering the Game of Allyship") and tags:
  - `3-2-1 Practice`, `Recursive 3-2-1`, `W.A.V.E.`, `Grounding`, `The Rose Tool`, `Contract Burning`, `Conscious Complaining`, `Happy Apples`, `Charge Diagnostic Mini-Game`, `The Fuel Check`, `Roll for Resonance`.
  - Tag Clean Up tools `moves: ['clean_up']`, `superpowers: ['alchemist']`, `aspect: 'both'`; tag detection tools (`Charge Diagnostic`, `Fuel Check`, `Roll for Resonance`) `moves: ['wake_up']`; `Grounding`/`W.A.V.E.` `moves: ['open_up','clean_up']`.
  - Each must pass `validateTechnique`.
- [x] **T9** Create `scripts/technique-coverage.ts`: load `public/allyship-deck/allyship-deck.json`, run `resolveTechniques` per card against the canonical seed (use a neutral loadout + both subjects), print a table of techniques-per-card and a list of zero-coverage cards (the gaps to author next).
- [x] **T10** Run `tsx scripts/technique-coverage.ts`; confirm 100% coverage of `clean_up` cards and record the gap list in the strand notes / backlog for future authoring.
- [x] **T11** Run `npm run check` — fail-fix.

## Phase 3 — Persistence (Prisma) — gated on real need for community/personal techniques

> Read `.agents/skills/prisma-migration-discipline/SKILL.md` first. Confirm whether `clean-up-technique-system`'s `Technique` model is already migrated and EXTEND it — do not create a second model.

- [ ] **T12** Edit `prisma/schema.prisma`: add the tag columns to `Technique` (see spec § Persisted data & Prisma): `operations`, `domains`, `channels`, `aspect`, `superpowers`, `capabilities`, `tier`, `status`, `origin`, `sourceName/sourceAuthor/sourceLineage/sourcePermission`, `allyshipReframe`, `ontologicalFooting`, `optimizesFor`, `failureModes`, `contraindications`, `ownerPlayerId`, `pinnedCardIds`.
- [ ] **T13** `npx prisma migrate dev --name technique_vocabulary_tags`; commit `prisma/migrations/…` together with `schema.prisma`.
- [ ] **T14** `npm run db:generate` then `npm run db:record-schema-hash`; `npm run db:sync`.
- [ ] **T15** Update `resolveTechniques` callers to run over the union of code-canonical + DB (community/personal) techniques.
- [ ] **T16** Human review `migration.sql` is additive; `npm run check` + `npm run build`.

## Backlog / housekeeping

- [ ] **T17** Add a `BACKLOG.md` entry for this spec (Priority per stack), then `npm run backlog:seed`.
- [ ] **T18** When the first UX surface (technique draw panel / authoring form) is specced, add the required **Verification Quest** (Twine + seed) per `spec-kit-translator` — not needed for Phases 1–3.

## Verification (every phase)
- `npm run check` — lint + type-check (fail-fix before moving on).
- `npm run build` — full Next.js build before any merge to main.
