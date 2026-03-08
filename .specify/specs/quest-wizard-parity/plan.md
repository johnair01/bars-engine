# Plan: Quest Wizard Parity

## Summary

Align Quest Wizard with quest grammar: require move + domain, add scope/reward/success criteria, optional BAR on completion.

## File Impacts

| File | Change |
|------|--------|
| [src/components/quest-creation/QuestWizard.tsx](../../src/components/quest-creation/QuestWizard.tsx) | Step 1: Move + Domain + Template; Step 2: success criteria; Step 3: scope, reward, BAR type; pass new fields |
| [src/actions/create-bar.ts](../../src/actions/create-bar.ts) | Validate moveType/allyshipDomain; accept successCriteria, barTypeOnCompletion; append successCriteria; store barTypeOnCompletion |
| [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts) | Handle barTypeOnCompletion in processCompletionEffects; spawn CustomBar for completer |

## Implementation Order

1. Quest Wizard UI (move, domain, scope, reward, success criteria, BAR type)
2. create-bar validation and persistence
3. quest-engine barTypeOnCompletion handling
4. Spec kit and verification
