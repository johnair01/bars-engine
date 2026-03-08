# Plan: Gameboard Quest Generation

## Summary

Align gameboard deck with Kotter stage (period). Add subquest support to gameboard UI. Seed starter subquests for Stage 1. Define feedback mechanism for quest generation improvement. Bruised Banana Residency as model.

## Phases

### Phase 1: Deck filtered by period

- Extend `getCampaignDeckQuestIds(campaignRef, period?)` — when period provided, filter `CustomBar.kotterStage = period`.
- Update `drawFromCampaignDeck` and `getOrCreateGameboardSlots` to pass period.
- Result: Period 1 gameboard shows only Stage 1 quests (Q-MAP-1 + starters when seeded).

### Phase 2: Starter subquests for Stage 1

- Add Q-MAP-1-WAKE, Q-MAP-1-CLEAN, Q-MAP-1-GROW, Q-MAP-1-SHOW to seed.
- Each: `parentId: Q-MAP-1`, `kotterStage: 1`, `allyshipDomain: GATHERING_RESOURCES`, `campaignRef: bruised-banana`.
- Extend `scripts/seed_bruised_banana_quest_map.ts` or create `scripts/seed_gameboard_starters.ts`.

### Phase 3: Subquest UI on gameboard

- Gameboard card: when quest has no parent (container) or is completable, add "Add subquest" button.
- Wire to `createSubQuest(parentId)` — reuse QuestNestingActions or inline.
- Cost: 1 vibeulon (existing quest-nesting logic).

### Phase 4: Feedback mechanism

- Option A: Add Report Issue to gameboard (reuse cert feedback pattern; scope to gameboard context).
- Option B: Link to Admin → Quests edit for the quest.
- Option C: Document feedback path in spec; defer implementation.

### Phase 5: Verification

- Run `npm run build` and `npm run check`.
- Manual: Period 1 gameboard shows only Stage 1 quests.
- Manual: Add subquest under Q-MAP-1, verify it appears.

### Phase 6: Verification Quest

- Twine story with 4 steps: (1) Open gameboard; (2) Confirm only Stage 1 quests; (3) Add subquest under container; (4) Complete verification.
- Add `cert-gameboard-quest-generation-v1` to `scripts/seed-cyoa-certification-quests.ts`.
- npm script: `seed:cert:cyoa` (existing) includes it.

**Implementation status**: Phases 1–3 largely done (period filter, starters, Add quest UI). Phase 4: Option B (Admin Edit) implemented. Phase 6: verification quest to be added.

## File Impacts

| File | Action |
|------|--------|
| `src/lib/gameboard.ts` | Add period filter to getCampaignDeckQuestIds |
| `src/actions/gameboard.ts` | Pass period to deck query |
| `scripts/seed_bruised_banana_quest_map.ts` | Add starter subquests (Q-MAP-1-*) |
| `src/app/campaign/board/GameboardClient.tsx` | Add "Add subquest" button |
| `data/bruised_banana_quest_map.json` | Add starters section (optional) |
| `scripts/seed-cyoa-certification-quests.ts` | Add cert-gameboard-quest-generation-v1 |

## Dependencies

- gameboard-campaign-deck (CV) — done
- bruised-banana-quest-map (BN) — done
- quest-nesting (createSubQuest) — exists
