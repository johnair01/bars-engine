# Plan: Scene Atlas (Creator Scene Grid Deck)

**Scene Atlas** = player-facing name; technical instance `creator-scene-grid`, route `/creator-scene-deck`.

**UX / style overhaul (deft):** [DEFT_IMPROVEMENT_PLAN.md](./DEFT_IMPROVEMENT_PLAN.md) — Sage consult + UI Style Guide binding + phased CYOA vs attach.

## Summary

Leverage **existing Prisma models** (`BarDeck`, `BarDeckCard`, `BarBinding`, `CustomBar`) to ship a **vertical slice**: seeded 52-card Scene Atlas + BAR bind flow + short teachable quest. Defer full Dominion hand/discard UX unless `ActorDeckState` is already wired for test instances.

## Implementation Order

### Phase 1: Seed + read API

1. Add script `scripts/seed-creator-scene-grid-deck.ts` (name flexible): inputs `instanceId` or `campaignRef` resolver; creates `BarDeck` if missing; upserts 52 `BarDeckCard` rows.
2. Add minimal **read** path: server action or page loader listing cards with binding status for current player (join `BarBinding` + `CustomBar`).

### Phase 2: Bind + create BAR

3. From card detail UI: “Answer with BAR” → opens **`CreateBarForm`** or reuses charge capture with **prefilled prompt** from `promptText`.
4. On save: create `BarBinding` (`cardId`, `barId`, `authorActorId`, `instanceId`).

### Phase 3: Pedagogy

5. Add **quest definition** (or Twine passage set) “Build your first deck row” — 4 cards (one per suit), then “complete a row of 13” as stretch goal.
6. Document in `docs/` or wiki: **Scene Atlas** (or “grid deck tutorial”) with optional link to this spec for implementers.

### Phase 3b: Polarity pairs (suits = 2×2)

6b. **Labels** for the four rows = Cartesian product of **two polarity pairs**; `BarDeckCard.suit` keys stay fixed (`SCENE_GRID_*`).
6c. **Resolve** per player: `storyProgress.gridPolarities` (orientation adventure) → derive from `Nation.element` + `Archetype.primaryWaveStage` → default Top/Bottom × Lead/Follow. Code: `polarities.ts`, `resolve-player-polarities.ts`, wired in `load-deck-view` + deck UI banner.

### Phase 4 (optional)

7. Wire **draw hand** using `ActorDeckState` if unique constraint allows custom instance; else document deferral to [dominion-style-bar-decks](../dominion-style-bar-decks/spec.md) `instanceId` optional migration.

## File Impacts (anticipated)

| Action | File / area |
|--------|-------------|
| Create | `scripts/seed-creator-scene-grid-deck.ts` |
| Create | `src/app/...` route or nested route under campaign/instance for deck UI |
| Edit | `src/actions/*` — `bindBarToDeckCard`, etc. |
| Edit | Wiki rules or `docs/CREATOR_SCENE_GRID_DECK.md` |
| Edit | `.specify/backlog/BACKLOG.md` |

## Verification

- [x] P0 UI self-audit vs [UI Style Guide](/wiki/ui-style-guide) — [UI_STYLE_SELF_AUDIT_P0.md](./UI_STYLE_SELF_AUDIT_P0.md); in-app guide § Scene Atlas; deck page footer links.
- [ ] Seed idempotent for same instance (no duplicate `@@unique` violations).
- [ ] Player can create private BAR and bind; non-owner cannot read private BAR from card unless shared.
- [ ] `npm run check`

## Open Questions

- **Instance provisioning**: net-new “Creator lab” instance vs piggyback existing BB instance (likely **separate** for clarity).
- **Suit strings**: confirm no future migration conflicts if `BarDeckCard.suit` is later constrained—prefer namespaced `SCENE_GRID_*`.
