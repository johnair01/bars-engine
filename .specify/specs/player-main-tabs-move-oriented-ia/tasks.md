# Tasks: Player Main Tabs — Move-Oriented IA

## Phase 0 — Six-face analysis + spec hardening ✅ 2026-03-22

- [x] **T0.1** Inventory routes and key components for Now (`/`), Vault (`/hand`, `/bars`, `/wallet`, `/daemons`, `/capture`), Play (`/adventures` + play subroutes).
- [x] **T0.2** Write `SIX_FACE_ANALYSIS.md`: per tab, six Game Master subsections + game-loop mapping.
- [x] **T0.3** Add synthesis table: gap → proposed move area → subpage affordances → priority (P0/P1/P2). (20 gaps, G1–G20)
- [x] **T0.4** Cross-review with [vault-page-experience](../vault-page-experience/spec.md) and [scene-atlas-game-loop](../scene-atlas-game-loop/spec.md); resolve contradictions in `plan.md`.
- [ ] **T0.5** Optional: wireframe or ASCII for one tab (Now) showing four-move shell + one subpage deep link each.

## Phase 1 — Shared shell (P0 gaps first)

P0 gates (from SIX_FACE_ANALYSIS.md — must land together):
- [x] **T1.0** Extract `getPlayerMoveContext(playerId)` shared server utility → returns `{ recommendedMoveType, hasChargeToday, completedMoveTypes, activeQuestCount, isSetupIncomplete }` (G17)
- [x] **T1.1** Move OrientationCompass to position 2 on NOW (after DashboardHeader, before everything else) and wire to `getPlayerMoveContext` (G1)
- [x] **T1.2** Merge DailyCheckInQuest wizard and OrientationCompass into a single ritual gate component (G2)
- [x] **T1.3** Collapse Vault lobby to move dashboard: VaultSummaryStrip + one CTA per move linking to correct sub-room; remove inline collapsible previews (G6)
- [x] **T1.4** Resolve `/play` vs `/adventures` route split — redirect `/play` → `/adventures` for authenticated users; inline demo loop as Wake Up section within `/adventures` for new players (G11)
- [x] **T1.5** Pass `recommendedMoveType` to `/adventures`; visually promote contextually appropriate container; add move badge to each card (G12, G16)

P1 follow-on (after P0 ships):
- [ ] **T1.6** Label DashboardActionButtons with move affiliation; reorganize into four-move quadrant layout (G4)
- [ ] **T1.7** Move AppreciationsReceived below OrientationCompass (G5)
- [ ] **T1.8** Add "Compost stale items →" CTA to Vault lobby when staleItems > 0 (G7)
- [ ] **T1.9** Collapse Vault room nav to single four-move rail; remove VaultQuickLinks duplication (G8)
- [ ] **T1.10** Add "In Campaign" status tag to VaultPersonalQuestsBlock for placed quests (G10)
- [ ] **T1.11** Add "Start with 321" as persistent Wake Up section on /adventures when no charge today (G19)

## Phase 2 — Vault

- [ ] **T2.1** Align Vault nested rooms with four-move IA; link from each move to concrete actions (drafts, compost, quests, invitations).
- [ ] **T2.2** Regression pass: caps, compost, style guide from VPE still hold.

## Phase 3 — Play

- [ ] **T3.1** Adventures index: move-aware sections or filters.
- [ ] **T3.2** In-adventure chrome: optional “current move context” copy or progress hint (no registry semantic drift).

## Verification

- [ ] **V.1** `npm run build` + `npm run check` after each merged phase.
- [ ] **V.2** Manual smoke: each tab reaches ≥1 do-action per move area (or documented exception).
