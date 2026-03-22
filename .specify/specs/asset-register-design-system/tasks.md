# Tasks: Asset Register Design System

## Phase 1 — Documentation + governance

- [ ] **T1.1** Commit this spec as the design source of truth. Add ARDS to BACKLOG.md.
- [ ] **T1.2** Add a `SEMANTIC_REGISTERS.md` summary (one table, one paragraph per register) to
  `docs/` — the entry point for forkers and contributors. Link from README and ARCHITECTURE.md.
- [ ] **T1.3** Annotate `src/lib/ui/card-tokens.ts` with register comments — each token group
  should note which register(s) it serves (e.g. `// Register 1 Cosmic + Register 5 Frame/Chrome`).

## Phase 2 — Move icons (Register 5, Frame/Chrome)

- [ ] **T2.1** Design 4 move icons at 24×24px pixel art weight:
  - Wake Up: ascending/upward mark
  - Grow Up: rightward/expanding mark
  - Show Up: outward/radiating mark
  - Clean Up: composting/downward-cycling mark
  Pixel art, monochrome base (color applied via CSS `filter` or element token class).
- [ ] **T2.2** Commit to `public/icons/moves/{wake-up,grow-up,show-up,clean-up}.png`
- [ ] **T2.3** Wire into OrientationCompass quadrant labels.
- [ ] **T2.4** Wire into VaultFourMovesStrip move badge slots.

## Phase 3 — Zone textures (Register 6, Zone/Texture)

- [ ] **T3.1** Generate or hand-pixel 3 tileable 64×64px RGBA dark textures:
  - `public/textures/zone-vault.png` — worn paper / parchment grain
  - `public/textures/zone-lobby.png` — stone tile faint grid
  - `public/textures/zone-quest.png` — subtle crosshatch (like graph paper at 10% opacity)
  All on transparent/near-black base.
- [ ] **T3.2** Apply to page backgrounds: replace `bg-black` with `bg-[#0a0908]` +
  CSS `background-image: url(/textures/zone-*.png)` on `/hand` routes and lobby pages.
- [ ] **T3.3** Document texture specs in `SEMANTIC_REGISTERS.md`.

## Phase 4 — Coherence audit

- [ ] **T4.1** Verify Cosmic + Walk Sprite palette alignment: nation_body sprite colors should
  match `ELEMENT_TOKENS[element].frame` values. Adjust sprite layer hues if needed.
- [ ] **T4.2** Verify Portrait derivation: CSS crop pattern (`object-position: center 15%`,
  element vignette) applied consistently in IntentAgentPanel and TradePanel.
- [ ] **T4.3** Document the one-AvatarConfig-three-renderers pattern in `avatar-utils.ts` JSDoc.

## Verification

- [ ] **V.1** SEMANTIC_REGISTERS.md is readable by a community member with no prior codebase knowledge.
- [ ] **V.2** All 7 registers have at least one implemented example in the running app.
- [ ] **V.3** `npm run build` + `npm run check` pass with 0 new errors after each phase.
