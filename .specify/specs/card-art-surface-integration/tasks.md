# Tasks: Card Art Surface Integration

## Phase 1 — Player Identity Card + Style Guide (highest leverage, proves the pattern)

- [ ] **T1.1** In `DashboardHeader.tsx`: import `lookupCardArt`, `QUARANTINED_CARD_KEYS` from
  `@/lib/ui/card-art-registry`. Derive `safeArt` using the quarantine gate pattern.
- [ ] **T1.2** Add `.card-art-window` div as first child inside the existing `CultivationCard`,
  above the identity row. Apply `STAGE_TOKENS[maturity].artWindowHeight` to height.
- [ ] **T1.3** Render `<img>` inside `.card-art-window` when `safeArt` non-null.
  Classes: `w-full h-full object-cover object-top {STAGE_TOKENS[maturity].artOpacity}`.
  Add `aria-hidden="true"` — art is decorative.
- [ ] **T1.4** Smoke test: log in as players from all 5 nations, verify correct art renders.
  Confirm shimmer shows for argyra-truth-seer and pyrakanth-joyful-connector.

- [ ] **T1.5** In `/wiki/ui-style-guide/page.tsx`: add `CultivationCardGallery` section.
- [ ] **T1.6** Render 5 cards (one per element) using real art at `stage="growing"`, `altitude="neutral"`.
- [ ] **T1.7** Render altitude strip (dissatisfied/neutral/satisfied) for fire element.
- [ ] **T1.8** Render stage strip (seed/growing/composted) for fire element.
- [ ] **T1.9** Render quarantine placeholder explicitly — shimmer visible for quarantined key.

## Phase 2 — NationProvider in Vault routes (prerequisite for Phase 3)

- [ ] **T2.1** In `/hand/page.tsx`: fetch `player.nation.element` + `player.archetype?.name`
  at RSC level. Wrap return tree in `<NationProvider element={...} archetypeName={...}>`.
- [ ] **T2.2** Repeat for `/hand/charges/page.tsx`.
- [ ] **T2.3** Repeat for `/hand/quests/page.tsx`.
- [ ] **T2.4** Repeat for `/hand/drafts/page.tsx`.
- [ ] **T2.5** Repeat for `/hand/invitations/page.tsx`.

## Phase 3 — BAR Card Migration

- [ ] **T3.1** Migrate `BarCardFace.tsx` from raw div to `CultivationCard`. Accept `element`
  prop from parent (BAR author's nation element).
- [ ] **T3.2** Set defaults: `stage="seed"`, `altitude="dissatisfied"`.
- [ ] **T3.3** Wire `imageUrl` into `.card-art-window` when present (`object-cover`).
- [ ] **T3.4** When `imageUrl` absent: render empty `.card-art-window` (element gradient shows through).
- [ ] **T3.5** Update all `BarCardFace` call sites to pass `element` prop.

## Phase 4 — Archetype Card Migration

- [ ] **T4.1** Migrate `ArchetypeCardWithModal.tsx` from raw div + hardcoded blue to `CultivationCard`.
  Pass explicit `element` prop from the archetype's nation.
- [ ] **T4.2** Look up art via `lookupCardArt(archetype.name, nationElement)`.
- [ ] **T4.3** Render at `stage="seed"`, `altitude="neutral"`, art window height `h-[30%]`.

## Phase 5 — Quest Card Migration

- [ ] **T5.1** Audit `QuestThread.tsx` and `QuestPack.tsx` — identify raw card divs.
- [ ] **T5.2** Migrate to `CultivationCard`. Wire element from NationProvider context.
- [ ] **T5.3** Use `stage="growing"` for active quests, `stage="composted"` for completed.
- [ ] **T5.4** Do NOT look up card-art-registry for personal quests — frame gradient is the art.

## Phase 6 — Nation Hero Banner + Small Badge

- [ ] **T6.1** Create `src/components/ui/NationHeroBanner.tsx`. Accepts `nationKey`, optional
  `playbookKey` (defaults to `'bold-heart'`). Renders Cosmic art as 100vw × 200px background
  wash at 30% opacity over element gradient.
- [ ] **T6.2** Create `src/components/ui/PlayerArtBadge.tsx`. Accepts `archetypeName`, `element`,
  `size`. Calls `lookupCardArt()`, falls back to `Avatar` sprite composite.
- [ ] **T6.3** Deploy `PlayerArtBadge` in the appreciations feed and movement feed where player
  identity indicators currently show initials only.

## Verification

- [ ] **V.1** All 5 elements render correct art in DashboardHeader. Quarantine shimmer confirmed.
- [ ] **V.2** Wiki style guide shows all 3 altitude + 3 stage variants with real art.
- [ ] **V.3** BAR card face renders player-uploaded image in art window when imageUrl present.
- [ ] **V.4** Vault routes all have NationProvider — `CultivationCard` shows correct element color.
- [ ] **V.5** `npm run build` + `npm run check` pass with 0 new errors after each phase.
