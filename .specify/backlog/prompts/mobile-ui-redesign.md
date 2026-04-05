# Prompt: Mobile UI Redesign (Game Loop + Deftness)

**Use this prompt when implementing the Mobile UI Redesign that aligns BAR surfaces with the game loop and applies deftness principles.**

## Summary

Implement per [.specify/specs/mobile-ui-redesign/spec.md](../specs/mobile-ui-redesign/spec.md). BAR Card as foundation component. Merge Forge + Charge Capture. BARs Deck (`/hand/deck`) vs Campaign Deck (`/bars/available`). API-first: `getBarCardData`, `mapCustomBarToBarCardData` before UI. No schema migration—CustomBar → BarCardData at read time.

## Key Decisions

- **BarCardData**: View model for display. chargeType from `inputs.emotion_channel` for charge_capture; else `'neutrality'`.
- **Edge glow**: anger→red, joy→green, sadness→blue, fear→white, neutrality→amber/gray.
- **Naming**: BARs Deck = daily hand; Campaign Deck = collective quest pool (formerly Market).

## Phases

1. **Phase 0**: mapCustomBarToBarCardData, getBarCardData, BarCardData type
2. **Phase 1**: BarCard component, migrate first consumer
3. **Phase 2**: The Forge (merge Capture + Create BAR)
4. **Phase 3**: BAR Detail + flip
5. **Phase 4**: Deck grids (BARs Deck, Campaign Deck)
6. **Phase 5**: Share image export

## Tasks

- [ ] Phase 0: [.specify/specs/mobile-ui-redesign/tasks.md](../specs/mobile-ui-redesign/tasks.md) T0.1–T0.6
- [ ] Phase 1: T1.1–T1.5
- [ ] Phase 2: T2.1–T2.4
- [ ] Phase 3: T3.1–T3.3
- [ ] Phase 4: T4.1–T4.4
- [ ] Phase 5: T5.1–T5.3

## References

- Spec: [.specify/specs/mobile-ui-redesign/spec.md](../specs/mobile-ui-redesign/spec.md)
- Plan: [.specify/specs/mobile-ui-redesign/plan.md](../specs/mobile-ui-redesign/plan.md)
- Tasks: [.specify/specs/mobile-ui-redesign/tasks.md](../specs/mobile-ui-redesign/tasks.md)
- Game Loop: [.specify/specs/game-loop-integration/spec.md](../specs/game-loop-integration/spec.md)
- Charge Capture: [.specify/specs/charge-capture-ux-micro-interaction/spec.md](../specs/charge-capture-ux-micro-interaction/spec.md)
- Deftness: [.agents/skills/deftness-development/SKILL.md](../../.agents/skills/deftness-development/SKILL.md)
