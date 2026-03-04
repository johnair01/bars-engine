# Prompt: Quest Grammar UX Flow

**Use when implementing the Quest Grammar UX flow.**

## Source

Spec: [quest-grammar-ux-flow](../../specs/quest-grammar-ux-flow/spec.md)

## Summary

The **quest-generation flow is a CYOA quest** the admin plays through—one question per passage. Multi-select for satisfaction (Q2), dissatisfaction (Q4), self-sabotage (Q6). Emotional alchemy move emerges from that data (ontology-driven). Unpacking + emotional alchemy + next move → AI constructs quest overview. Target archetype + developmental lens tailor output. Completing the flow produces the generated quest. Recursive: trigger "Generate another quest" from within a quest. **Repeatable prompt-to-Twine process** (mechanics, choice design, admin flavor editing). **Phase 5: node gap bridging** — player-move (quest) vs storyteller-story (narrative passage).

## Prompt text

> Implement the Quest Grammar UX Flow per [.specify/specs/quest-grammar-ux-flow/spec.md](../../specs/quest-grammar-ux-flow/spec.md). Phases: (0) Emotional alchemy ontology—map moves, derive from multi-select; (1) Multi-select Q2/Q4/Q6; (1b) Generation flow as CYOA—one question per passage; (1c) Archetype + lens inputs; (2) QuestPacket → .twee; (3) .twee → Adventure + QuestThread; (4) Campaign orientation; (5) Passage completion, AI generation, recursive generation. **Repeatable process**: prompt → skeleton → Twine → admin flavor pass. **Phase 5e**: edge-level gap bridging—admin chooses player move (generate quest) or storyteller story (generate narrative passage). See plan and tasks for details.

## Reference

- Spec: [.specify/specs/quest-grammar-ux-flow/spec.md](../../specs/quest-grammar-ux-flow/spec.md)
- Plan: [.specify/specs/quest-grammar-ux-flow/plan.md](../../specs/quest-grammar-ux-flow/plan.md)
- Tasks: [.specify/specs/quest-grammar-ux-flow/tasks.md](../../specs/quest-grammar-ux-flow/tasks.md)
