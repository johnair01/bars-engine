# Backlog Prompt: Game Loop — Charge → Quest → Campaign

**Spec**: [.specify/specs/game-loop-charge-quest-campaign/spec.md](../specs/game-loop-charge-quest-campaign/spec.md)  
**Game Master analysis**: [.specify/specs/game-loop-charge-quest-campaign/STRAND_CONSULT.md](../specs/game-loop-charge-quest-campaign/STRAND_CONSULT.md)

## Problem

The 321→quest flow breaks. Players metabolize charge but cannot complete the path to quest creation and campaign placement. Quests created from 321 are orphaned. The dashboard does not show "Campaigns I'm responsible for" or "next effective milestone." User reported overwhelm by options—the flow should reduce choice paralysis.

## Scope

1. **321→quest fix** — Diagnose and fix "Turn into Quest" from Shadow321Form. Redirect to Hand with quest visible. Post-create placement options.
2. **Placement API** — `addQuestToThread`, `addQuestAsSubquestToGameboard`, `getPlacementOptionsForQuest`. Hand extension with personal quests and placement actions.
3. **Dashboard campaign overview** — "Campaigns I'm responsible for" (where player is leader/owner). "Next effective milestone" per campaign. Start minimal; reduce overwhelm.

## Implementation

Implement per `.specify/specs/game-loop-charge-quest-campaign/` — spec.md, plan.md, tasks.md. Follow tasks in order. Check off completed tasks.

## References

- `src/components/shadow/Shadow321Form.tsx` — handleTurnIntoQuest
- `src/actions/charge-metabolism.ts` — createQuestFrom321Metadata
- `src/app/hand/page.tsx` — Hand as hub
- [Game Loop BARS↔Quest↔Thread↔Campaign](../specs/game-loop-bars-quest-thread-campaign/spec.md) — placement API contracts
