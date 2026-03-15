# Spec Kit Prompt: Game Master Face Moves

## Role

You are a Spec Kit agent implementing explicit moves for each Game Master face. Each move produces a BAR (CustomBar).

## Objective

Implement Phase 1 game moves for all six faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage). Every move, when executed, creates a CustomBar with `gameMasterFace` set. BAR types: `vibe` (default), `insight` (Shaman shadow belief, Sage witness).

## Requirements

- **BAR output**: Every face move creates a CustomBar; `gameMasterFace` MUST be set
- **Symmetry**: Each face has applications in both codebase and game (Phase 1 = game)
- **Domain constraint**: Faces do not leave their domains except with Sage counsel
- **Sage as trickster**: Sage can run as another face (same tools, different prompt) — Phase 2

## Phase 1 Moves (Game) — Each Produces a BAR

| Face | Move | BAR Produced |
|------|------|--------------|
| Shaman | Create ritual | BAR (vibe) — ritual moment, named belief before quest |
| Shaman | Name shadow belief | BAR (insight) — shadow belief; Shaman witnesses |
| Challenger | Issue challenge | BAR (vibe) — challenge; links to optional quest |
| Challenger | Propose move | BAR (vibe) — move recommendation |
| Regent | Declare period | BAR (vibe) — period declaration |
| Regent | Grant role | BAR (vibe) — role granted |
| Architect | Offer blueprint | BAR (vibe) — blueprint; players fork as quest |
| Architect | Design layout | BAR (vibe) — layout suggestion |
| Diplomat | Offer connection | BAR (vibe) — connection suggestion |
| Diplomat | Host event | BAR (vibe) — event invitation |
| Sage | Witness | BAR (vibe/insight) — witness note |
| Sage | Cast hexagram | BAR (vibe) — hexagram reading |

## Deliverables

- [ ] `createFaceMoveBar(face, moveType, input)` — creates CustomBar with gameMasterFace
- [ ] Shaman: Create ritual; Name shadow belief
- [ ] Challenger: Issue challenge; Propose move
- [ ] Regent: Declare period; Grant role
- [ ] Architect: Offer blueprint
- [ ] Diplomat: Offer connection; Host event
- [ ] Sage: Witness; Cast hexagram (extend CastingRitual)
- [ ] Verification: Execute each move; confirm BAR created with correct gameMasterFace

## Reference

- Spec: [.specify/specs/game-master-face-moves/spec.md](../specs/game-master-face-moves/spec.md)
- Plan: [.specify/specs/game-master-face-moves/plan.md](../specs/game-master-face-moves/plan.md)
- Tasks: [.specify/specs/game-master-face-moves/tasks.md](../specs/game-master-face-moves/tasks.md)
- Exploration: [.specify/specs/game-master-face-moves/EXPLORATION.md](../specs/game-master-face-moves/EXPLORATION.md)
- Game Master Sects: [.agent/context/game-master-sects.md](../../.agent/context/game-master-sects.md)
