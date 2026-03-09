# Plan: Superpower Move Extensions v0

## Overview

Implement Superpower Move Extensions as an optional Layer 4 overlay on the transformation pipeline. Superpowers extend base archetypes for allyship-domain quest generation. Only apply when player has unlocked and quest domain is relevant.

## Phases

### Phase 1: Extension Data

- Add `src/lib/narrative-transformation/moves/superpower-extensions.ts`.
- Define SuperpowerExtension type.
- Implement catalog: Connector, Storyteller, Strategist, Alchemist, Escape Artist, Disruptor.
- Implement getSuperpowerExtension(superpowerId), isSuperpowerCompatible(superpowerId, archetypeKey).

### Phase 2: Unlock Logic (Stub)

- Define unlock check interface (player has superpower unlocked).
- Stub: assume unlocked for v0 or require explicit superpowerId in context.
- Future: integrate with player progression / allyship prestige unlock.

### Phase 3: Overlay Integration

- Implement applySuperpowerOverlay(moves, extension, archetypeKey, allyshipDomain).
- Wire into selectMoves when superpowerId provided and compatible.
- Quest seeds incorporate superpower modifiers when applicable.

### Phase 4: Tests

- Unit tests: compatibility, overlay application.
- Integration: superpower + archetype + domain produces distinct output.

## Implementation Layout

```
src/lib/narrative-transformation/moves/
  superpower-extensions.ts
  selectMoves.ts       # Add optional applySuperpowerOverlay
```

## Out of Scope (v0)

- Full unlock progression system.
- Superpower unlock UI.
- Rich superpower-specific move catalogs.
