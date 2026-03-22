# Tasks: BAR Seed Metabolization

## Phase 0 — Spec + research

- [x] Strand consult: [STRAND_CONSULT.md](./STRAND_CONSULT.md)
- [x] Spec kit from consult: `spec.md`, `plan.md`, `tasks.md` (this file)
- [x] Pipeline documentation: [docs/STRAND_TO_SPEC_KIT.md](../../../docs/STRAND_TO_SPEC_KIT.md)
- [ ] **BSM-R1** User research — 3 profiles (high-volume capture, grief-heavy, casual): validate soil/compost/friction
- [ ] **BSM-R2** Copy deck v0 — Playful vs Solemn; compost ritual strings; **no** shame metrics

## Phase 1 — MVP backend

- [x] **BSM-D1** Data decision: `CustomBar.seedMetabolization` JSON blob (`soilKind`, `contextNote`, `maturity`, `compostedAt`, `releaseNote`) + `archivedAt` for compost soft-archive
- [x] **BSM-D2** Migration `20260318130000_bar_seed_metabolization` + `src/lib/bar-seed-metabolization/*`
- [x] **BSM-A1** Server actions: `nameBarSeedSoil`, `updateBarSeedMaturity`, `compostBarSeed`, `restoreBarSeedFromCompost`, `graduateBarSeedToQuest` (dynamic import → `growQuestFromBar`)

## Phase 2 — MVP UI

- [x] **BSM-U1** Opt-in Nursery at `/bars/garden` + link from `/bars`
- [x] **BSM-U2** BAR detail (owner, `bar` | `charge_capture`): `BarSeedGardenPanel` — soil, note, maturity, compost / restore
- [x] **BSM-U3** Garden filters: soil, maturity; toggle to include composted (`?composted=1`)

## Phase 3 — Optional

- [ ] **BSM-O1** Random BAR / “draw one seed” ritual (feature flag)
- [ ] **BSM-O2** Wire `QuestSeedContext.nationLibraryId` where narrative seeds are built from charge (if product wants)

## Backlog

- [x] **BSM-BL** Row **1.28.7 BSM** in [BACKLOG.md](../../backlog/BACKLOG.md)
