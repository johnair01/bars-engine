# Spec: Nation and Playbook Choice Privileging

## Purpose

Limit CYOA passage choices to 2–3 (style guide) and privilege paths: one favoring the nation's element, one favoring the playbook's WAVE move. Uses player archetype and nation to personalize choice selection.

## Context

- Style guide: 2–4 choices per passage (4 when move spread is primary)
- Nations map to elements (Pyrakanth→fire, Lamenth→water, etc.)
- Playbooks have WAVE stages (Wake Up, Clean Up, Grow Up, Show Up)
- 15 canonical moves have element and primary WAVE stage
- See [plan.md](./plan.md) for resolved open questions and implementation summary

## Dependencies

- [Playbook Primary WAVE Spec](../backlog/prompts/playbook-primary-wave-spec.md) — placeholder used until spec implemented
- [Quest Grammar UX Flow](../quest-grammar-ux-flow/spec.md) — generation flow, target archetype
- [Emotional Alchemy Interfaces](../../.agent/context/emotional-alchemy-interfaces.md)

## Functional Requirements

- **FR1**: Nation model MUST have required `element` field (metal, water, wood, fire, earth).
- **FR2**: Knowledge base MUST include Emotional Alchemy page at `/wiki/emotional-alchemy` — 5 elements, 15 moves, Nation↔element, Playbook↔WAVE, choice privileging rules — so admins can manually create engaging quests without AI.
- **FR3**: Choice selection MUST privilege at least one nation-element move and one playbook-WAVE move when target nation/playbook provided.
- **FR4**: Choices per passage MUST be limited to 2–4 (style guide). When move spread is the primary axis (longitudinal branching), allow up to 4 choices (one per move: Wake Up, Clean Up, Grow Up, Show Up). When nation/playbook privileging applies, privilege 2–3 paths; when all 4 moves are relevant, allow 4.

## Reference

- Plan: [plan.md](./plan.md)
- Move engine: [src/lib/quest-grammar/move-engine.ts](../../src/lib/quest-grammar/move-engine.ts)
- Nations: [src/lib/game/nations.ts](../../src/lib/game/nations.ts)
