# Tasks: Quest Grammar Action Node Refactor

## Phase 1: Types

- [x] Add `ActionType = 'donation' | 'signup' | 'complete' | 'generic'` to `src/lib/quest-grammar/types.ts`
- [x] Add `isActionNode?: boolean` and `actionType?: ActionType` to `QuestNode`; remove `isDonationNode`
- [x] Update all `QuestNode` usages: `isDonationNode` → `isActionNode`; set `actionType` where applicable

## Phase 2: Compiler

- [x] Add `getActionTypeForCampaign(campaignId?: string): ActionType` — bruised-banana → donation; default → donation
- [x] In `compileQuestCore.ts`: set `isActionNode: true` on transcendence/wins; set `actionType` from campaignId
- [x] Ensure transcendence/wins templates retain ritual+transaction framing (action-specific CTA stays for donation)

## Phase 3: Tests and Docs

- [x] Update `compileQuest.test.ts`: assert `isActionNode`; assert `actionType === 'donation'` for Bruised Banana input
- [x] Update `questGrammarSpec.md`: "action node" terminology; document actionType and campaign mapping

## Phase 4: Deftness Integration

- [x] Add checklist entry to `.agents/skills/deftness-development/reference.md`: "Quest grammar: action node over donation node; campaign-aware actionType"
- [x] Update Quest Quality Automation plan: add dependency on this spec for campaign-aware scorer

## Verification

- [x] `npm run test:quest-grammar` — all tests pass
- [x] `npm run build` — succeeds
- [x] `npm run check` — no new lint/type errors
