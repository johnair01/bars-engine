# Tasks: Player Main Tabs — Move-Oriented IA

## Phase 0 — Six-face analysis + spec hardening

- [ ] **T0.1** Inventory routes and key components for Now (`/`), Vault (`/hand`, `/bars`, `/wallet`, `/daemons`, `/capture`), Play (`/adventures` + play subroutes).
- [ ] **T0.2** Write `SIX_FACE_ANALYSIS.md`: per tab, six Game Master subsections + game-loop mapping.
- [ ] **T0.3** Add synthesis table: gap → proposed move area → subpage affordances → priority (P0/P1/P2).
- [ ] **T0.4** Cross-review with [vault-page-experience](../vault-page-experience/spec.md) and [scene-atlas-game-loop](../scene-atlas-game-loop/spec.md); resolve contradictions in `plan.md`.
- [ ] **T0.5** Optional: wireframe or ASCII for one tab (Now) showing four-move shell + one subpage deep link each.

## Phase 1 — Shared shell (after T0 sign-off)

- [ ] **T1.1** Add shared layout primitive (move rail or quadrants) with accessible labels and mobile behavior.
- [ ] **T1.2** Pilot on **Now** (`/`): route existing dashboard sections under move regions without losing critical paths.
- [ ] **T1.3** Document URL strategy (query `?move=` vs path `/now/wake` etc.) in this folder.

## Phase 2 — Vault

- [ ] **T2.1** Align Vault nested rooms with four-move IA; link from each move to concrete actions (drafts, compost, quests, invitations).
- [ ] **T2.2** Regression pass: caps, compost, style guide from VPE still hold.

## Phase 3 — Play

- [ ] **T3.1** Adventures index: move-aware sections or filters.
- [ ] **T3.2** In-adventure chrome: optional “current move context” copy or progress hint (no registry semantic drift).

## Verification

- [ ] **V.1** `npm run build` + `npm run check` after each merged phase.
- [ ] **V.2** Manual smoke: each tab reaches ≥1 do-action per move area (or documented exception).
