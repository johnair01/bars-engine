# Prompt: Random Unpacking Canonical Kernel

**Use this prompt when implementing canonical kernel refactor for random unpacking.**

## Context

Refactor random unpacking so satisfaction (Q2) and dissatisfaction (Q4) derive from emotional alchemy moves; experience (Q1) derives from nation and playbook; move and self-sabotage (Q6) are randomized from canonical sources.

## Prompt text

> Implement Random Unpacking Canonical Kernel per [.specify/specs/random-unpacking-canonical-kernel/spec.md](../specs/random-unpacking-canonical-kernel/spec.md). (1) Create canonical-kernel.ts with ELEMENT_CHANNEL_STATES, getLabelsForMove, pickExperienceForPlayer. (2) Refactor generateRandomUnpacking to accept playerContext, pick random move from ALL_CANONICAL_MOVES, derive q2/q4 from move, alignedAction=move.name, moveType=move.primaryWaveStage. (3) generateGrammaticQuestFromReading: pass nation element + playbook wave to generateRandomUnpacking; pass moveType to compileQuestWithAI. Run npm run build and npm run check — fail-fix.

## Checklist

- [ ] Phase 1: canonical-kernel.ts
- [ ] Phase 2: generateRandomUnpacking refactor
- [ ] Phase 3: generateGrammaticQuestFromReading integration

## Reference

- Spec: [.specify/specs/random-unpacking-canonical-kernel/spec.md](../specs/random-unpacking-canonical-kernel/spec.md)
- Plan: [.specify/specs/random-unpacking-canonical-kernel/plan.md](../specs/random-unpacking-canonical-kernel/plan.md)
- Tasks: [.specify/specs/random-unpacking-canonical-kernel/tasks.md](../specs/random-unpacking-canonical-kernel/tasks.md)
- Depends on: CR (I Ching Grammatic Quests), BY (Quest Grammar Compiler)
