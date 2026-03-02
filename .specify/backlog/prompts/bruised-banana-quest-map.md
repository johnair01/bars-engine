# Prompt: Bruised Banana Quest Map (Kotter-Based)

**Use this prompt when implementing the Kotter-based quest map for the Bruised Banana fundraiser.**

## Prompt text

> Implement the Bruised Banana Quest Map per [.specify/specs/bruised-banana-quest-map/spec.md](../../specs/bruised-banana-quest-map/spec.md). Create 8 container quests (one per Kotter stage) with GATHERING_RESOURCES descriptions; configure instance with goal ($3000) and 30-day timeline; add idempotent seed script. Players add subquests via createSubQuest (parentId = one of the 8 containers). Market shows only the current stage's quest (existing filtering). Use game language: WHAT = quests; WHERE = GATHERING_RESOURCES; Kotter = 8-stage change model.

## Checklist

- [ ] Instance has goalAmountCents, startDate, endDate (30 days)
- [ ] 8 CustomBars exist (Q-MAP-1 … Q-MAP-8) with kotterStage 1–8, allyshipDomain: GATHERING_RESOURCES
- [ ] Idempotent seed script (scripts/seed_bruised_banana_quest_map.ts)
- [ ] npm run seed:quest-map runs successfully
- [ ] Market shows only current stage's quest when instance active
- [ ] Player can createSubQuest under container quest

## Reference

- Spec: [.specify/specs/bruised-banana-quest-map/spec.md](../../specs/bruised-banana-quest-map/spec.md)
- Plan: [.specify/specs/bruised-banana-quest-map/plan.md](../../specs/bruised-banana-quest-map/plan.md)
- Tasks: [.specify/specs/bruised-banana-quest-map/tasks.md](../../specs/bruised-banana-quest-map/tasks.md)
- Kotter domain matrix: [.agent/context/kotter-by-domain.md](../../../.agent/context/kotter-by-domain.md)
