# Prompt: Quest Grammar Compiler (V1) + Segment Variants + Onboarding Refactor

**Use this prompt when implementing the quest grammar compiler that generates onboarding content from 6 Unpacking Questions + Aligned Action.**

## Context

The compiler transforms unpacking answers into an Emotional Alchemy Signature and a 6-beat Epiphany Bridge quest thread. Output supports player and sponsor segment variants. The donation moment is both ritual threshold and practical transaction. Output is deterministic, testable, and feeds CampaignReader via Passages.

## Prompt text

> Implement the Quest Grammar Compiler per [.specify/specs/quest-grammar-compiler/spec.md](../specs/quest-grammar-compiler/spec.md). Part of [bruised-banana-launch-specbar](bruised-banana-launch-specbar.md). Add `src/lib/quest-grammar/` with: questGrammarSpec.md, types.ts, compileQuest.ts. **Campaign Owner–facing unpacking input UI** (Allyship Target / Ally in Mastering the Game of Allyship context): admin or dedicated flow for Q1–Q6 + aligned action (ritual or form style); on submit, compileQuest runs → QuestPacket → Passages or preview. Implement signature extraction, 6 Epiphany Bridge nodes, segment lens (player/sponsor), donation node (ritual+transaction), curiosity-gated lore, telemetry hooks. Unit tests + Bruised Banana snapshot. Create docs/onboardingRefactorPlan_bruisedBanana.md. Output must be deterministic.

## Checklist

- [ ] Phase 1: questGrammarSpec.md, types.ts
- [ ] Phase 2: compileQuest.ts (signature, nodes, segment lens, donation, telemetry)
- [ ] Phase 3: Unit tests + snapshot test
- [ ] Phase 4: Campaign Owner–facing unpacking input UI (Q1–Q6 + aligned action)
- [ ] Phase 5: docs/onboardingRefactorPlan_bruisedBanana.md

## Reference

- Spec: [.specify/specs/quest-grammar-compiler/spec.md](../specs/quest-grammar-compiler/spec.md)
- Plan: [.specify/specs/quest-grammar-compiler/plan.md](../specs/quest-grammar-compiler/plan.md)
- Tasks: [.specify/specs/quest-grammar-compiler/tasks.md](../specs/quest-grammar-compiler/tasks.md)
- Related: [campaign-onboarding-twine-v2](campaign-onboarding-twine-v2.md)
