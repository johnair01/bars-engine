# Plan: Kotter Quest Seed Grammar

**Spec:** [spec.md](./spec.md)

## Done (v0)

1. [`src/lib/kotter-quest-seed-grammar.ts`](../../../src/lib/kotter-quest-seed-grammar.ts) — slots, alchemy lines, face micro lines, `composeKotterQuestSeedBar`.
2. [`src/lib/campaign-deck-quests.ts`](../../../src/lib/campaign-deck-quests.ts) — deck wizard urgency quests use composer.
3. [`src/actions/admin-campaign-deck.ts`](../../../src/actions/admin-campaign-deck.ts) — persist `emotionalAlchemyTag` + `gameMasterFace` when non-null on quest rows.
4. Tests: [`src/lib/__tests__/kotter-quest-seed-grammar.test.ts`](../../../src/lib/__tests__/kotter-quest-seed-grammar.test.ts).

## Done (spec v1 — design only)

5. **Spec addendum** in [spec.md](./spec.md): six-face headline guidance, dual-face semantics, stage-specific metabolism, **8×6 GM face–stage move matrix**, milestone gating model.

## Next (implementation)

### Phase A — Move registry + composer (done)

- [`src/lib/gm-face-stage-moves.ts`](../../../src/lib/gm-face-stage-moves.ts) — 48 moves; `getGmFaceStageMoveById`, `getGmFaceStageMovesForStage`, `resolveGmFaceStageMoveForComposition`.
- [`composeKotterQuestSeedBar`](../../../src/lib/kotter-quest-seed-grammar.ts) / `fillKotterQuestSeedSlots`: optional `gmFaceMoveId` → title segment, micro-beat, evidence, `completionEffects.moveId`; `gameMasterFace` defaults from move when omitted.
- Optional follow-up: align generic `STAGE_MICRO_BEAT` / `STAGE_EVIDENCE` with matrix defaults (reduce drift).

### Before Phase B (frozen in spec)

- [spec.md § Addendum E](./spec.md) — player encounter surfaces, shared Kotter stage, owner-as-admin, nested campaigns, **Sage v1 inheritance** (`parentCampaignRef`, provenance, resets, optional defaults).

### Phase B — Gating + UI (done — hub + milestones v1)

- [`getAvailableFaceMovesForStage`](../../../src/lib/gm-face-moves-availability.ts), [`getGmFaceMoveAvailabilityForCampaign`](../../../src/actions/campaign-portals.ts), hub data via [`get8PortalsForCampaign`](../../../src/actions/campaign-portals.ts) (`faceMoves`).
- Campaign hub: [`GmFaceMovesPanel`](../../../src/components/campaign/GmFaceMovesPanel.tsx).
- [`recordContribution`](../../../src/actions/campaign-deck.ts) → auto-complete milestone at target + bump `kotterStage`; [`adminCompleteCampaignMilestone`](../../../src/actions/campaign-deck.ts) for milestones without targets.
- **Later:** spoke / quest-create surfaces using the same availability primitive (Addendum E).

### Phase C — Headline refresh + reading tint (done)

- **Stage 1** domain headline in composer: `STAGE_1_PLAY_HEADLINE` (play-speak); stages 2–8 still use `getStageAction`; face-move title still overrides title segment when `gmFaceMoveId` set.
- **`readingFace`** on [`composeKotterQuestSeedBar`](../../../src/lib/kotter-quest-seed-grammar.ts) input → second lens block + `completionEffects.readingFace`; structural `gameMasterFace` unchanged.

### Ongoing

- Wire CYOA spoke exit to call composer with player alchemy + `gmFace` + `instance.kotterStage` + optional `gmFaceMoveId`.
- Add hexagram **names** from DB/Canon when available (trigram pair remains fallback).
- Optional LLM **polish** pass: take composed markdown as input; cap tokens; default off.
