# Tasks: Trust/Attune Encounter Loop

Verification marker for every phase: `cd mtgoa-game && npm test && npm run typecheck && npm run build`.

## Phase 0 — Diagnosis (DONE)

- [x] Write `engine/__tests__/completability.sim.test.ts` — play the real channel
      reducer for all six superpowers vs Priya under a greedy policy.
- [x] Confirm the result: **0 / 6 winnable (softlock)**; document the two root causes
      (counter coverage, Show Up ceiling) in `spec.md` § Purpose.

## Phase 1 — Trust engine + Level-1 Priya (DONE)

- [x] `engine/trust/trustTypes.ts` — `EncounterConfig`, `TrustCard`, `TrustShadow`.
- [x] `engine/trust/trustRules.ts` — trust / stress / shadow tunables.
- [x] `engine/trust/trustEngine.ts` — pure reducer (ATTUNE/PLAY/BASIC/DISSOLVE/CAPSTONE/RESET) + selectors; capstone win, rupture loss.
- [x] `engine/trust/level1Priya.ts` — fixed Water need, 3 shadows, convert-at-2, one her-only domain, matched starter deck.
- [x] `engine/trust/__tests__/trustCompletability.sim.test.ts` — prove L1 winnable (novice/expert/floor), no dead end, choice-driven rupture.

## Phase 2 — Difficulty ladder + UI (DONE)

- [x] `engine/trust/level2Priya.ts` — paired Water/Fire rhythm, 4 shadows, convert-at-3, two her-only domains.
- [x] `engine/trust/bossPriya.ts` — three-channel moving need, 6 shadows, higher start stress (parallel effort; reconciled).
- [x] Standardize the attune model: **ATTUNE spends the beat + paired needs** (revert the free-attune/deep-read variant); add per-level `convertThreshold` override.
- [x] Extend proofs: `trustCompletability.sim.test.ts` covers L1 + L2; `bossPriyaCompletability.sim.test.ts` covers Boss. **Suite: 21/21 green.**
- [x] `screens/TrustEncounterScreen.tsx` — config-agnostic, L1 / L2 / Boss rung switcher; mounted from `App.tsx` (additive toggle, `#l1-priya` / `#boss-priya`).
- [x] Renumber: L1 = 1, L2 = 2, Boss = 3 (resolve the level-field collision).

## Phase 3 — Deferred (NOT STARTED)

- [ ] **Visual verification** — run the Vite app, screenshot all three rungs (L1/L2/Boss happy path + a rupture).
- [ ] **BAR-crafting / explore-play** — promote earned BARs into craftable player cards (loot tables per domain).
- [ ] **More NPCs on the trust loop** — author trust decks for Bev, Jerome, Dara, etc.
- [ ] **Applied Mode** — six-question intake → generated `EncounterConfig`.
- [ ] **Real-world bridge** — map in-game moves to real actions (dual-track, non-AI delivery).

## Notes

- No `prisma/schema.prisma` change → no migration task.
- Not tracked in `BACKLOG.md` yet; add an entry + `npm run backlog:seed` if this graduates from prototype to roadmap.
