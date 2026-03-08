# Prompt: Onboarding CYOA Generator — Unblock Invitation Sending

**Use this prompt when implementing the onboarding CYOA generator that produces Donate/Sign Up flows from Campaign Owner unpacking.**

## Context

The onboarding flow is blocked until the system can generate grammatical CYOA content. Admin (Campaign Owner) inputs unpacking Q1–Q6; system generates an onboarding CYOA that leads visitors to **Donate** (Show Up / Gathering Resources) or **Sign Up** (Wake Up). Same repeatable process for quest threads and mini-campaigns. Includes a random test harness to vet quest grammar before launch.

## Prompt text

> Implement the Onboarding CYOA Generator per [.specify/specs/onboarding-cyoa-generator/spec.md](../specs/onboarding-cyoa-generator/spec.md). Create `generateOnboardingCYOA` that wraps `compileQuest` with Epiphany Bridge (6 beats) and action node options Donate | Sign Up. Create `generateRandomTestInput` for random hexagram (1–64), random unpacking via `generateRandomUnpacking`, and random nation/playbook from DB. Create `validateQuestGrammar` that runs N iterations and returns pass/fail + sample failures. Add `npm run test:onboarding-grammar` script. API-first; reuse existing quest grammar, I Ching alignment, and random unpacking systems.

## Checklist

- [ ] Phase 1: API contracts and types
- [ ] Phase 2: generateOnboardingCYOA
- [ ] Phase 3: generateRandomTestInput
- [ ] Phase 4: validateQuestGrammar
- [ ] Phase 5: Verify build and check

## Reference

- Spec: [.specify/specs/onboarding-cyoa-generator/spec.md](../specs/onboarding-cyoa-generator/spec.md)
- Plan: [.specify/specs/onboarding-cyoa-generator/plan.md](../specs/onboarding-cyoa-generator/plan.md)
- Tasks: [.specify/specs/onboarding-cyoa-generator/tasks.md](../specs/onboarding-cyoa-generator/tasks.md)
- Related: [quest-grammar-compiler](quest-grammar-compiler.md), [campaign-onboarding-twine-v2](campaign-onboarding-twine-v2.md), [iching-grammatic-quests](iching-grammatic-quests.md)
