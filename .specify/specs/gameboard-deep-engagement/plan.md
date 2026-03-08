# Plan: Gameboard Deep Engagement

## Summary

Implement 3-step completion (Wake Up → Clean Up → Show Up), steward visibility, vibeulon bidding, AID/fork, and hexagram-aligned campaign-throughput quest generation. De-emphasize Complete; emphasize the journey.

## Phases

### Phase 1: 3-step completion flow

- Add `GameboardSlotProgress` or extend `PlayerQuest` with wake/clean/show timestamps + reflection.
- Gameboard card: show Read → Reflect → Complete flow. Complete disabled until steps 1–2 done.
- Actions: `recordWakeUp(slotId)`, `recordCleanUp(slotId, reflection)`. `completeGameboardQuest` checks progress.
- UI: Replace prominent Complete with stepped flow. Visual hierarchy: Read first, Reflect second, Complete last.

### Phase 2: Steward model

- Add `stewardId` to `GameboardSlot` (or `GameboardSteward` join).
- "Take quest" flow: player claims slot → becomes steward. Slot shows steward name.
- "Release" flow: steward can release; slot returns to unclaimed.
- Slot UI: show steward name, progress (wake/clean/show).

### Phase 3: Bidding, AID, Fork

- **Bid:** `GameboardBid` model; `placeBid(slotId, amount)`; logic for highest bidder, time window.
- **AID:** `offerAid(slotId, message, type?)` — type: `direct` (EFA, support) or `quest` (create a quest to unblock steward). For `quest`: helper creates a quest (wizard or grammatical) and offers it as unblocking aid.
- **Fork:** `forkQuestPrivately(questId)` — private copy for player. Clarify fork completion semantics.

### Phase 4: Hexagram + campaign goal quest generation

- New action: `generateCampaignThroughputQuest(hexagramId, campaignRef, period)`.
- Fetch hexagram, instance/campaign goal, stage action (from Kotter stage, not name).
- Prompt: *How does [stage action] directly tie to people showing up in [campaign goal]?* Use hexagram for tone.
- Output: quest without Kotter stage names in title. Add to deck or as admin-generated option.
- Wire to gameboard "Generate grammatical quest" or new "Generate from hexagram" flow.

### Phase 5: Verification

- Build, check, manual tests.
- Verify: 3-step gate, steward visibility, hexagram generation quality.

## File Impacts

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add GameboardSlotProgress, GameboardBid; stewardId on slot |
| `src/actions/gameboard.ts` | recordWakeUp, recordCleanUp, steward logic, placeBid, offerAid, forkQuestPrivately |
| `src/app/campaign/board/GameboardClient.tsx` | 3-step UI, steward display, bid/AID/fork buttons |
| `src/actions/quest-grammar.ts` or new | generateCampaignThroughputQuest with hexagram + campaign goal |
| `src/lib/quest-grammar/buildQuestPromptContext.ts` | Campaign goal + stage action in prompt (no stage names in title) |

## Dependencies

- gameboard-ui-update (CZ)
- iching-grammatic-quests (CR)
- quest-grammar-compiler (BY)
