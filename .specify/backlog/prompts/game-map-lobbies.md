# Backlog Prompt: Game Map and Lobby Navigation

## Spec

- Spec: [.specify/specs/game-map-lobbies/spec.md](../specs/game-map-lobbies/spec.md)
- Plan: [.specify/specs/game-map-lobbies/plan.md](../specs/game-map-lobbies/plan.md)
- Tasks: [.specify/specs/game-map-lobbies/tasks.md](../specs/game-map-lobbies/tasks.md)

## Summary

Four lobbies as the primary entry points to the game, mapped to the 4 moves: Library (Wake Up), Emotional First Aid (Clean Up), Schools/Dojos (Grow Up), Gameboard (Show Up). Implement Game Map / Lobby Hub UI, lobby routing, orientations, and clarify adventure relationship. Dojos deferred.

## Key Deliverables

- **Game Map / Lobby Hub**: Route `/game-map` or `/lobbies` with four lobby cards
- **Lobby routing**: Library → /library or /docs; EFA → /emotional-first-aid; Dojos → placeholder; Gameboard → /campaign/board
- **Orientations**: Explain each lobby and its move; integrate with dashboard-orientation-flow
- **Adventure relationship**: Document—Gameboard = primary completion surface; adventures = story nodes
- **Dojos**: Placeholder only; full UI deferred (quest-library-wave-routing)

## Dependencies

- Onboarding BARs + Library (Library with Public BARs)
- Quest Library Wave Routing (Dojo pool)
- Dashboard Orientation Flow (post-signup redirect, orientation threads)
- Campaign Map Phase 1 (campaign map layers)
