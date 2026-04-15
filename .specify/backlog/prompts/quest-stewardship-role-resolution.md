# Prompt: Quest Stewardship + Role Resolution Engine v0

**Use this prompt when implementing the stewardship engine.**

## Prompt text

> Implement the Quest Stewardship + Role Resolution Engine v0 per [.specify/specs/quest-stewardship-role-resolution/spec.md](../specs/quest-stewardship-role-resolution/spec.md). Service-layer engine that resolves stewards (from take_quest), quest state (proposed→active→completed), and roles from BAR responses. Add resolveThreadRoles, resolveQuestSteward, computeQuestState, getQuestRoles. Deterministic, API-first. Depends on BAR Response + Threading RACI. Use game language: stewardship channels Energy into coordinated action; take_quest = Show Up (ownership).

## Checklist

- [ ] resolveThreadRoles(barId)
- [ ] resolveQuestSteward(questId)
- [ ] computeQuestState(questId) — proposed | active | completed | archived
- [ ] getQuestRoles(questId)
- [ ] State transition: first take_quest → active
- [ ] Role recomputation when response withdrawn

## Reference

- Spec: [.specify/specs/quest-stewardship-role-resolution/spec.md](../specs/quest-stewardship-role-resolution/spec.md)
- Depends: [bar-response-threading-raci](../specs/bar-response-threading-raci/spec.md)
