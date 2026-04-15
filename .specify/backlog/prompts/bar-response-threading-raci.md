# Prompt: BAR Response + Threading Model v0 (RACI Integration)

**Use this prompt when implementing RACI role derivation for BAR threads.**

## Prompt text

> Implement the BAR Response + Threading Model v0 (RACI Integration) per [.specify/specs/bar-response-threading-raci/spec.md](../specs/bar-response-threading-raci/spec.md). Extend BarResponse so responses produce collaboration roles derived from intents: take_quest→Responsible, join→Accountable, consult→Consulted, witness→Informed. Add getBarThread and getBarRoles API. Enforce max thread depth 2. Use game language: responses channel Energy into collaboration topology; take_quest = Show Up (stewardship); witness = Wake Up (awareness). API-first, deterministic, no manual role assignment.

## Checklist

- [ ] Add take_quest, consult to BAR_RESPONSE_TYPES
- [ ] Implement deriveThreadRoles(responses) — RACI mapping
- [ ] getBarThread(barId) — bar, responses, threadRoles, threadState
- [ ] getBarRoles(barId) — derived roles only
- [ ] Update respondToBar for take_quest, consult
- [ ] Thread depth validation (max 2)

## Reference

- Spec: [.specify/specs/bar-response-threading-raci/spec.md](../specs/bar-response-threading-raci/spec.md)
- Next: [quest-stewardship-role-resolution](../specs/quest-stewardship-role-resolution/spec.md)
