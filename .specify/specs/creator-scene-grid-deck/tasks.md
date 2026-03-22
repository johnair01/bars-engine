# Tasks: Scene Atlas (Creator Scene Grid Deck)

## Phase 0: Spec kit

- [x] Add `.specify/specs/creator-scene-grid-deck/spec.md`
- [x] Add `.specify/specs/creator-scene-grid-deck/plan.md`
- [x] Add `.specify/specs/creator-scene-grid-deck/tasks.md`
- [x] Register in `.specify/backlog/BACKLOG.md`

## Phase 1: Seed + data

- [x] Implement seed script: `BarDeck` + 52× `BarDeckCard` (`SCENE_GRID_*` × rank 1–13) — `scripts/seed-creator-scene-grid-deck.ts`
- [x] Neutral default `promptText` / `promptTitle` per card — `src/lib/creator-scene-grid-deck/prompts.ts`
- [x] `npm run seed:creator-scene-deck` in `package.json` + script header

## Phase 2: Read model + UI shell

- [x] Server: `loadSceneGridDeckView` + `/creator-scene-deck/[slug]`
- [x] UI: `SceneDeckClient` — 4 suits × 13 cells; filled vs empty

## Phase 3: Write path

- [x] Scene grid bind — `applySceneGridBindingInTx` + `createCustomBar` (Scene Atlas hidden fields) or `bindSceneGridCardToExistingBar` — `CustomBar` + `BarBinding` + `InstanceParticipation`

- [x] Rebind: archive prior active binding for same player + card

## Phase 4: Teach all players

- [x] On-page steps + `/wiki/grid-deck` + wiki index link
- [ ] Optional: formal quest thread / CYOA (defer)

## Phase 5: Polarity pairs (two axes → four suits)

- [x] `polarities.ts` + `archetype-trigram-polarities.ts` — pair2 from **trigram** (8-way table); wave fallback; [POLARITY_DERIVATION.md](./POLARITY_DERIVATION.md)
- [x] `npm run audit:grid-polarities` — DB audit script for author review
- [x] `resolve-player-polarities.ts` — resolution order: adventure → derived → default
- [x] Wire `load-deck-view` + UI banner + row labels + `displayTitle` on cards
- [x] Tests `polarities.test.ts`; wiki updated (two pairs + sources)
- [x] Quest completion effects: `commitDerivedSceneAtlasAxes` + `mergeGridPolarities` in `quest-engine.ts`; seed **Send Your First Signal** commits derived Scene Atlas axes (`source: oriented`)

## Phase 6: Verification

- [x] `npm run test:creator-scene-grid` (52 prompts + polarities)
- [x] ESLint on touched files
- [x] `npm run check` — may fail on pre-existing `verify:transformation-registry-lockstep`; run `tsc --noEmit` if needed
- [ ] Manual: two players, private BAR not leaked across users

## Phase 7: Deft UX + style guide alignment

_See [DEFT_IMPROVEMENT_PLAN.md](./DEFT_IMPROVEMENT_PLAN.md) for Sage synthesis and checklist._

- [x] **P0** Route `layout.tsx`: `min-h-screen bg-black text-zinc-200` (match `/bars` canvas)
- [x] **P0** Self-audit vs [Wiki UI Style Guide](/wiki/ui-style-guide) (modals, progressive disclosure)
- [x] **P1** Card modal **step 0**: **Attach BAR** | **Guided new BAR** | tertiary full vault form (`SceneDeckCardPanel`)
- [x] **P1** Attach list: **Inspirations (`type: bar`)** vs **other vault** optgroups; same query as before + `type` for grouping
- [x] **Next scene** After a successful bind/create, open the **next empty cell** in suit×rank order (`scene-atlas-nav.ts` + `SceneDeckClient` + toast)
- [x] **P2** Short CYOA draft model + server actions; 3–7 steps → composed BAR + bind
- [x] **P3** Replace single-scroll modal with wizard/tabs for advanced BAR fields
- [x] **P3** Reduce 52-tile density: collapsible suits and/or larger targets (≥44px)

## Deferred (explicit)

- [ ] Full Dominion hand/discard — follow [dominion-style-bar-decks](../dominion-style-bar-decks/spec.md)
- [ ] `PlayerDeck` promotion from [deck-card-move-grammar](../deck-card-move-grammar/spec.md)
