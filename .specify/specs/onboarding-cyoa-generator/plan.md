# Plan: Onboarding CYOA Generator

## Summary

Phased implementation: (1) API contracts + types, (2) generateOnboardingCYOA wiring to compileQuest, (3) generateRandomTestInput, (4) validateQuestGrammar, (5) Admin UI integration.

## Phases

### Phase 1: API contracts and types

- Create `src/lib/onboarding-cyoa-generator/` with types.ts
- Define OnboardingCYOAInput, ValidationReport
- Export stubs for generateOnboardingCYOA, generateRandomTestInput, validateQuestGrammar

### Phase 2: generateOnboardingCYOA

- Wire to compileQuest with Epiphany Bridge (questModel: 'personal')
- Ensure action node supports Donate | Sign Up outcomes
- Return QuestPacket

### Phase 3: generateRandomTestInput

- Random hexagram (1–64); build IChingContext from Bar + getHexagramStructure
- Call generateRandomUnpacking with random nation/playbook context
- Fetch random nation and playbook IDs from db

### Phase 4: validateQuestGrammar

- Run N iterations (default 5)
- For each: generateRandomTestInput → compileQuest (or compileQuestWithAI)
- Validate: 6 nodes, beat order, choices present, action node
- Return ValidationReport with pass/fail and failures

### Phase 5: Admin UI (deferred)

- Extend UnpackingForm or add Campaign Owner flow
- Generate → preview → seed Adventure

## File Impacts

| File | Action |
|------|--------|
| `src/lib/onboarding-cyoa-generator/types.ts` | Create |
| `src/lib/onboarding-cyoa-generator/generateOnboardingCYOA.ts` | Create |
| `src/lib/onboarding-cyoa-generator/generateRandomTestInput.ts` | Create |
| `src/lib/onboarding-cyoa-generator/validateQuestGrammar.ts` | Create |
| `src/lib/onboarding-cyoa-generator/index.ts` | Create |
| `package.json` | Add test:onboarding-grammar script |

## Dependencies

- quest-grammar-compiler (BY)
- iching-grammatic-quests (CR)
- random-unpacking-canonical-kernel (CS)
