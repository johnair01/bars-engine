# Tasks: Onboarding CYOA Generator

## Phase 1: API contracts

- [x] Create `src/lib/onboarding-cyoa-generator/types.ts` with OnboardingCYOAInput, ValidationReport
- [x] Create `src/lib/onboarding-cyoa-generator/index.ts` with exports

## Phase 2: generateOnboardingCYOA

- [x] Create `generateOnboardingCYOA.ts`; wire to compileQuest
- [x] Ensure Epiphany Bridge + action node (Donate | Sign Up)

## Phase 3: generateRandomTestInput

- [x] Create `generateRandomTestInput.ts`
- [x] Random hexagram from 1–64; build IChingContext from Bar + getHexagramStructure
- [x] Call generateRandomUnpacking with random nation/playbook
- [x] Fetch random nation and playbook from db

## Phase 4: validateQuestGrammar

- [x] Create `validateQuestGrammar.ts`
- [x] Run N iterations; validate nodes, beats, choices
- [x] Add `npm run test:onboarding-grammar` script

## Phase 5: Verification

- [x] Run `npm run build` and `npm run check`
- [x] Run `npm run test:onboarding-grammar` (5 iterations)
