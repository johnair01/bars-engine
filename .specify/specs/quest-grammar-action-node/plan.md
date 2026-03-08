# Plan: Quest Grammar Action Node Refactor

## Summary

Generalize donation node → action node. One schema change propagates: types → compileQuestCore → tests. Unlocks campaign-aware quest quality scoring. High-leverage deftness item.

## Phase 1: Types

| Action | File | Change |
|--------|------|--------|
| Add | `src/lib/quest-grammar/types.ts` | `ActionType = 'donation' | 'signup' | 'complete' | 'generic'` |
| Modify | `QuestNode` | Replace `isDonationNode` with `isActionNode`; add `actionType?: ActionType` |
| Modify | `QuestCompileInput` | Document `campaignId` → actionType mapping (or add `actionType?: ActionType` override) |

## Phase 2: Compiler

| Action | File | Change |
|--------|------|--------|
| Modify | `src/lib/quest-grammar/compileQuestCore.ts` | Set `isActionNode: true` on transcendence/wins; set `actionType` from campaignId |
| Logic | `getActionTypeForCampaign(campaignId?: string): ActionType` | bruised-banana → donation; onboarding → signup; default → donation |

## Phase 3: Tests and Docs

| Action | File | Change |
|--------|------|--------|
| Modify | `src/lib/quest-grammar/__tests__/compileQuest.test.ts` | Assert `isActionNode`; assert `actionType` for fundraiser input |
| Modify | `src/lib/quest-grammar/questGrammarSpec.md` | Replace "donation node" with "action node"; document actionType |

## Phase 4: Deftness Integration

| Action | File | Change |
|--------|------|--------|
| Modify | `.agents/skills/deftness-development/reference.md` | Add "Quest grammar: use action node over donation node; campaign-aware actionType" to checklist |
| Reference | Quest Quality Automation plan | Add dependency on this spec for campaign-aware scorer |

## File Impacts

| File | Impact |
|------|--------|
| `src/lib/quest-grammar/types.ts` | Add ActionType; QuestNode.isActionNode, actionType |
| `src/lib/quest-grammar/compileQuestCore.ts` | isDonationNode → isActionNode; set actionType |
| `src/lib/quest-grammar/questGrammarSpec.md` | Terminology update |
| `src/lib/quest-grammar/__tests__/compileQuest.test.ts` | Assertion updates |
| `.agents/skills/deftness-development/reference.md` | Checklist entry |

## Verification

- `npm run test:quest-grammar` — all tests pass
- `npm run build` — succeeds
- Grep for `isDonationNode` — no remaining references (or backward compat alias if needed)
