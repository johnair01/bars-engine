# Prompt: I Ching Grammatic Quests

**Use this prompt when implementing I Ching → grammatic quest flow.**

## Context

Integrate I Ching context into Quest Grammar so all quest generation uses hexagram data when available. Replace I Ching CustomBar output with QuestPacket → CYOA. Random unpacking is generated first; the I Ching draw provides oracle context.

## Prompt text

> Implement I Ching Grammatic Quests per [.specify/specs/iching-grammatic-quests/spec.md](../specs/iching-grammatic-quests/spec.md). (1) Add IChingContext to types.ts; inject in buildQuestPromptContext; extend cache keys. (2) Create generateRandomUnpacking() from unpacking-constants. (3) Refactor generateQuestFromReading: random unpacking + ichingContext → compileQuestWithAI → publishIChingQuestToPlayer. (4) publishIChingQuestToPlayer creates Adventure + Passages, assigns to player. (5) UI redirects to adventure play. Run npm run build and npm run check — fail-fix.

## Checklist

- [ ] Phase 1: I Ching context in Quest Grammar
- [ ] Phase 2: generateRandomUnpacking
- [ ] Phase 3: I Ching grammatic flow + publishIChingQuestToPlayer + UI

## Reference

- Spec: [.specify/specs/iching-grammatic-quests/spec.md](../specs/iching-grammatic-quests/spec.md)
- Plan: [.specify/specs/iching-grammatic-quests/plan.md](../specs/iching-grammatic-quests/plan.md)
- Tasks: [.specify/specs/iching-grammatic-quests/tasks.md](../specs/iching-grammatic-quests/tasks.md)
- Depends on: CO (I Ching Alignment), BY (Quest Grammar Compiler)
