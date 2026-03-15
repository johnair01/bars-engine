# Spec Kit Prompt: Phase 1 Face Moves Remainder

## Role

You are a Spec Kit agent implementing the remaining Phase 1 Game Master Face Moves (Challenger, Architect, Diplomat).

## Objective

Implement per [.specify/specs/phase-1-face-moves-remainder/spec.md](../specs/phase-1-face-moves-remainder/spec.md). **API-first**: define action signatures and data shapes before UI. Spec: [phase-1-face-moves-remainder](.specify/specs/phase-1-face-moves-remainder/).

## Requirements

- **Actions**: `issueChallenge`, `proposeMove`, `offerConnection`, `hostEvent` in face-move-bar.ts
- **Integration**: Extend `forkQuestPrivately` to create Architect `offer_blueprint` BAR
- **UI**: Hand page Face Moves section — Issue challenge, Get move, Offer connection, Host event
- **BAR output**: Every move creates CustomBar with `gameMasterFace` set

## Checklist (API-First Order)

- [ ] API contracts defined in spec
- [ ] Server actions implemented in face-move-bar.ts
- [ ] forkQuestPrivately extended in gameboard.ts
- [ ] Hand page UI wired to actions
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] .specify/specs/phase-1-face-moves-remainder/spec.md
- [ ] .specify/specs/phase-1-face-moves-remainder/plan.md
- [ ] .specify/specs/phase-1-face-moves-remainder/tasks.md
- [ ] Implementation per tasks.md

## Reference

- Parent: [game-master-face-moves](../specs/game-master-face-moves/spec.md)
- createFaceMoveBar: [src/actions/face-move-bar.ts](../../src/actions/face-move-bar.ts)
- ALL_CANONICAL_MOVES: [src/lib/quest-grammar/move-engine.ts](../../src/lib/quest-grammar/move-engine.ts)
