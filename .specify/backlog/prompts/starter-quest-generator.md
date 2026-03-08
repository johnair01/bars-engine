# Prompt: Starter Quest Generator v1 + Emotional Alchemy Integration

**Use this prompt when implementing domain-biased starter quest assignment and canonical emotional move resolution.**

## Context

After onboarding, players should receive 1 primary quest (by intended_impact_domain) plus up to 2 optional quests. Emotional move logic must come from the canonical grammar—no hardcoded transitions in quest definitions. Integrates with existing assignOrientationThreads, CustomBar, move-engine, lens-moves.

## Prompt text

> Implement the Starter Quest Generator spec per [.specify/specs/starter-quest-generator/spec.md](../specs/starter-quest-generator/spec.md). Create `resolveMoveForContext(allyshipDomain, lens?)` in quest-grammar using move-engine + lens-moves + DOMAIN_MOVE_PREFERENCE. Seed 5 starter quest CustomBars (Strengthen, Invite, Declare, Test, Create Momentum) with allyshipDomain. Create `getStarterQuestsForPlayer(playerId, campaignRef)` and extend assignOrientationThreads to assign domain-biased primary + 2 optional when lens present. Add cert-starter-quest-generator-v1. No new tables. Run `npm run build` and `npm run check`.

## Checklist

- [ ] resolveMoveForContext
- [ ] Seed 5 starter quest templates
- [ ] getStarterQuestsForPlayer
- [ ] Extend assignOrientationThreads
- [ ] cert-starter-quest-generator-v1
- [ ] npm run build and check

## Reference

- Spec: [.specify/specs/starter-quest-generator/spec.md](../specs/starter-quest-generator/spec.md)
- Plan: [.specify/specs/starter-quest-generator/plan.md](../specs/starter-quest-generator/plan.md)
- Tasks: [.specify/specs/starter-quest-generator/tasks.md](../specs/starter-quest-generator/tasks.md)
- Integration analysis: [docs/STARTER_QUEST_GENERATOR_INTEGRATION_ANALYSIS.md](../../docs/STARTER_QUEST_GENERATOR_INTEGRATION_ANALYSIS.md)
