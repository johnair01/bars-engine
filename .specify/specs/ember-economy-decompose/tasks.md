# Tasks: Ember economy decomposition

proof: HARVEST.md in this folder, the ported sim tests' output, and each retirement PR's Vercel preview of the Between
preview: each retirement PR's Vercel preview, opened at `/ontology-game/between?nook=1&skipHome=1`

## Phase 0: falsify

- [x] T001 [claude] Run mtgoa-game's four sim tests in place and record the results in HARVEST.md (FR-001, FR-002)

## Phase 1: harvest

- [x] T002 [claude] Write HARVEST.md, H1 to H9, with the commit read at; count unconverted initialVibeulons (H9) (FR-001) (done 2026-11-04 except the H9 count, which needs a database read: query in HARVEST.md)
- [x] T003 [claude] Port the stress track, contagion and element pool to `src/lib/ember-economy/harvest/` with their sim tests passing (FR-002)
- [x] T004 [claude] Write the Show Up finding and its sim result into HARVEST.md; cite it from ember-to-vibeulon (FR-003)
- [x] T005 [claude] Draft DaemonSpiritLineage against the live Daemon, BetweenDaemon and BetweenSpirit shapes in plan.md (FR-004)

## Phase 2: retire, one PR each

- [x] T006 [claude] Remove `mtgoa-game/` and its tsconfig exclude, naming the T003 PR (FR-005)
- [x] T007 [claude] Remove `understood-game/` (FR-006)
- [ ] T008 [claude] Rebuild the deck templates with five moves and charge as playCost; post the Open Up cards as a look on the board before merge (FR-007)
- [x] T009 [claude] Compost the four charge-routing stubs (FR-008)
- [ ] T010 [claude] Migrate DaemonSpiritLineage and join the rows (FR-009)
- [ ] T011 [claude] Retire StarterPack.initialVibeulons: stop the writers, convert once, drop the column (FR-010)
