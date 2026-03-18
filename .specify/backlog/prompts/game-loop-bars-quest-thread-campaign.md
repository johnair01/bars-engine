# Backlog Prompt: Game Loop BARS↔Quest↔Thread↔Campaign

**Strand**: `wzeucv2iqtxbjaa83v987q4m`  
**Spec**: [.specify/specs/game-loop-bars-quest-thread-campaign/STRAND_OUTPUT.md](../specs/game-loop-bars-quest-thread-campaign/STRAND_OUTPUT.md)

## Problem

The main game loop is broken. Players cannot extend BARS into Quests, Quests into Threads, and Threads into Campaigns. The reverse flow is also broken: campaigns should generate grammatical quests that attract BARS and subquests.

**Explore after capturing charge** — users report it does not give the ability to create a quest (or the created quest is orphaned / not part of the loop).

## Scope

1. **Forward flow**: BARS → Quests → Threads → Campaigns
   - Charge capture → Explore → Create quest (exists but quest may be orphaned)
   - Quest → add to Thread
   - Thread → link to Campaign

2. **Reverse flow**: Campaigns → Quests → BARS
   - Campaign generates grammatical quests (Kotter/Epiphany Bridge)
   - Quests attract BARs (response, subquest attachment)
   - Subquests can spawn from quest completion or BAR attachment

## References

- `src/actions/charge-capture.ts` — `createQuestFromSuggestion`, `generateQuestSuggestionsFromCharge`
- `src/components/charge-capture/ChargeExploreFlow.tsx`, `ChargeCaptureForm.tsx`
- `src/actions/quest-thread.ts` — `advanceThreadForPlayer`, thread creation
- `src/actions/generate-quest.ts` — `generateGrammaticQuestFromReading`
- `src/actions/quest-nesting.ts` — subquest attachment
- `.specify/specs/bar-quest-generation-engine/spec.md`
- `.specify/specs/bruised-banana-quest-map/spec.md`
