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

### Phase A — Move registry + composer

- Add static registry (or generated JSON) for 48 moves: `id`, `kotterStage`, `face`, `title`, `action`, `evidence`.
- Extend `composeKotterQuestSeedBar` / `fillKotterQuestSeedSlots` with optional `gmFaceMoveId` → title, micro-beat, evidence, `completionEffects.moveId`.
- Align `STAGE_MICRO_BEAT` / evidence with matrix where redundant (reduce drift).

### Phase B — Gating + UI

- Implement `getAvailableFaceMoves(campaignRef, playerId)` using `Instance.kotterStage` and/or `CampaignMilestone` completion.
- Move picker in quest / spoke flow: only current-stage moves (or `<= unlockedStage` per product choice in spec).
- Wire milestone completion → advance `kotterStage` (or `unlockedStageMax`) per spec §D.

### Phase C — Headline refresh (optional)

- Replace or supplement `getStageAction(1, domain)` with face-move titles when a move is selected; keep domain lines as neutral fallback.
- Optional: `readingFace` tint line at render without overwriting structural face.

### Ongoing

- Wire CYOA spoke exit to call composer with player alchemy + `gmFace` + `instance.kotterStage` + optional `gmFaceMoveId`.
- Add hexagram **names** from DB/Canon when available (trigram pair remains fallback).
- Optional LLM **polish** pass: take composed markdown as input; cap tokens; default off.
