# Tasks: World From Image

Order matters: finish a phase before starting the next. Run `npm run check` after each phase.

## Phase 1: PlanScene and sprout emitter (no AI, no keys)

- [ ] T1: `scripts/world-from-image/plan-scene.ts` with the types from spec.md and `validatePlanScene`
- [ ] T2: `vocab.json` plus `vocab.sprout.json`; list unmapped kinds in `notes` for Wendell instead of adding assets
- [ ] T3: `emit-sprout.ts` with run-length merging of terrain into rectangles
- [ ] T4: Fixtures: one interior, one village (`fixtures/*.scene.json`)
- [ ] T5: Unit tests: validator rejects out-of-bounds, unknown vocab key, unreachable link; emitter is byte-stable
- [ ] T6: Emit both fixtures and run them through sprout's checker

```bash
npx tsx scripts/world-from-image/emit-sprout.ts scripts/world-from-image/fixtures/tavern.scene.json > /tmp/tavern.spec.json
cd /path/to/sprout && npm run map:check -- /tmp/tavern.spec.json
```

- [ ] T7: Wendell reviews the two previews (verification, see spec)

## Phase 0: Learn what image-blaster emits (needs approval and keys)

- [ ] T8: Wendell picks one input image he owns and approves the spend
- [ ] T9: Dry-run plan: list the services called and the data sent
- [ ] T10: Run image-blaster once with audio off; record the output tree, units, axes and cost in `docs/image-blaster-output.md`
- [ ] T11: Record the license terms for World Labs and FAL outputs

## Phase 2: Producer adapter

- [ ] T12: `blast.ts`: dry run by default, `--yes` to call services, cache by image hash
- [ ] T13: Mesh bounding boxes to footprints, snapped to cells
- [ ] T14: Orthographic top-down render of the meshes
- [ ] T15: Vocabulary-constrained terrain labeling with confidence notes
- [ ] T16: Spawn and door proposals flagged for confirmation
- [ ] T17: Run on three images; Wendell grades each: usable, needs edits, discard

## Phase 3: bars-engine emitter

- [ ] T18: `emit-realm.ts` plus `vocab.bars-engine.json`
- [ ] T19: Round-trip test through `JsonRealmAdapter.parse`
- [ ] T20: Load one scene in the map editor (`/admin` spatial map editor) and confirm walls match impassable cells

## Track B: root-game backdrop (on request)

- [ ] T21: Render one Phase 0 world from the `side` and `three` angles at 288x180
- [ ] T22: Backdrop copy of the page on a root-game branch
- [ ] T23: Phone test: frame cost and look; Wendell's verdict

## Housekeeping

- [ ] T24: Add `.specify/backlog` entry and run `npm run backlog:seed` once Wendell confirms the priority
- [ ] T25: Add env vars to `docs/ENV_AND_VERCEL.md` as local-only
