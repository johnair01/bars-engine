# Plan: Bruised Banana Quest Map (Kotter-Based)

## Summary

Create a Kotter-based quest map for the Bruised Banana fundraiser: 8 container quests (one per stage), instance config with goal + 30-day timeline, and idempotent seed script. Players add subquests via existing `createSubQuest` and `appendExistingQuest`; Market shows only the current stage's quest.

## Implementation

### 1. Instance configuration (goal + timeline)

- **File**: `src/actions/instance.ts`
  - Ensure `upsertInstance` accepts and persists `startDate`, `endDate` (if not already)
- **File**: `src/app/admin/instances/page.tsx`
  - Add startDate/endDate fields to Admin Instances form (if not already)
- **File**: `data/bruised_banana_quest_map.json` (new) or extend `data/party_seed_bb_bday_001.json`
  - Add `startDate`, `endDate` (30-day window)
  - `goalAmountCents: 300000` ($3000)

### 2. Quest map seed data

- **File**: `data/bruised_banana_quest_map.json` (new)
  - 8 quest definitions with IDs Q-MAP-1 … Q-MAP-8
  - Each: title, description (from GATHERING_RESOURCES matrix), kotterStage (1–8), allyshipDomain, reward (1 or small base)

### 3. Seed script

- **File**: `scripts/seed_bruised_banana_quest_map.ts` (new)
  - Upsert Bruised Banana instance (slug from BB-BDAY-001 or bruised-banana) with goalAmountCents, startDate, endDate
  - Upsert 8 CustomBars (Q-MAP-1 … Q-MAP-8)
  - Use admin/system player as creatorId
  - Idempotent: upsert by id
- **File**: `package.json`
  - Add: `"seed:quest-map": "npx tsx scripts/seed_bruised_banana_quest_map.ts"`

### 4. Optional: QuestThread grouping

- **File**: `scripts/seed_bruised_banana_quest_map.ts`
  - Optional: Create QuestThread "Bruised Banana Fundraiser Quest Map" and link 8 quests via ThreadQuest (for grouping; Market shows by kotterStage regardless)

## Verification

1. Run `npm run seed:quest-map`; 8 quests exist with correct kotterStage.
2. Instance has goalAmountCents, startDate, endDate.
3. With Bruised Banana active at stage 2, Market shows only Stage 2 quest.
4. Player can createSubQuest under Stage 2 container; subquest appears.
5. Admin advances kotterStage; Stage 3 quest appears in Market.

## File Impact Summary

| File | Change |
|------|--------|
| data/bruised_banana_quest_map.json | New — quest map + instance config |
| scripts/seed_bruised_banana_quest_map.ts | New — idempotent seed |
| package.json | +seed:quest-map script |
| src/actions/instance.ts | Verify startDate/endDate in upsert |
| src/app/admin/instances/page.tsx | Verify startDate/endDate in form |

## Reference

- Spec: [.specify/specs/bruised-banana-quest-map/spec.md](spec.md)
- Kotter lib: [src/lib/kotter.ts](../../src/lib/kotter.ts)
- Party seed: [scripts/seed_party_bb_bday_001.ts](../../scripts/seed_party_bb_bday_001.ts)
