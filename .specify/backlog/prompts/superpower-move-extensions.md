# Prompt: Superpower Move Extensions v0

**Use this prompt when implementing Superpower Move Extensions — Allyship prestige classes, Connector, Storyteller, Strategist, etc.**

## Context

Superpower Move Extensions extend base archetypes for allyship-domain quest generation. Superpowers (Connector, Storyteller, Strategist, Alchemist, Escape Artist, Disruptor) are not base archetypes—they are domain-specific advanced specializations. Each superpower attaches to one or more base archetypes. Only apply when player has unlocked and quest domain is relevant.

## Prompt text

> Implement Superpower Move Extensions per [.specify/specs/superpower-move-extensions/spec.md](../specs/superpower-move-extensions/spec.md). Add `src/lib/narrative-transformation/moves/superpower-extensions.ts` with SuperpowerExtension type and catalog (connector, storyteller, strategist, alchemist, escape-artist, disruptor). Implement getSuperpowerExtension(superpowerId), isSuperpowerCompatible(superpowerId, archetypeKey), applySuperpowerOverlay(moves, extension, archetypeKey, allyshipDomain). Wire into selectMoves when superpowerId provided and compatible. Stub unlock logic for v0. Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: SuperpowerExtension type, catalog, getSuperpowerExtension, isSuperpowerCompatible
- [ ] Phase 2: Unlock stub (accept superpowerId in context)
- [ ] Phase 3: applySuperpowerOverlay, wire into selectMoves
- [ ] Phase 4: Unit tests, integration with Archetype Move Styles

## Reference

- Spec: [.specify/specs/superpower-move-extensions/spec.md](../specs/superpower-move-extensions/spec.md)
- Plan: [.specify/specs/superpower-move-extensions/plan.md](../specs/superpower-move-extensions/plan.md)
- Tasks: [.specify/specs/superpower-move-extensions/tasks.md](../specs/superpower-move-extensions/tasks.md)
- Archetype Move Styles: [.specify/specs/archetype-move-styles/spec.md](../specs/archetype-move-styles/spec.md)
- Transformation Move Library: [.specify/specs/transformation-move-library/spec.md](../specs/transformation-move-library/spec.md)
