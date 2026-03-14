# Spec: Archetype Playbooks (Moves List)

## Purpose

Reintroduce **Playbook** as a distinct concept: each Archetype has a Playbook — a list of moves (NationMoves) that define what that archetype can do. This extends the player's move set beyond the base 4 WAVE moves and nation moves.

**Parent**: [deftness-uplevel-character-daemons-agents](../spec.md)

**Context**: The playbook-to-archetype rename made "Archetype" the user-facing term for the 8 I Ching identities. We now reintroduce "Playbook" as the moves list belonging to an Archetype.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Playbook = moves list | Playbook is not a separate entity; it is the set of NationMoves linked to an Archetype |
| Schema | Use existing `NationMove.archetypeId`; Archetype has many NationMoves. "Playbook" = query result, not new table |
| Naming | UI: "Your Playbook" = "Moves for [Archetype Name]". Avoid confusion with legacy Playbook→Archetype rename |

## Conceptual Model

- **Archetype**: 8 I Ching identities (Bold Heart, Devoted Guardian, etc.)
- **Playbook**: The list of NationMoves where `archetypeId = selectedArchetype`
- **Player**: Has `archetypeId`; playbook = moves for that archetype. Player may also have Daemon moves.

## Schema (Existing + Clarification)

```prisma
// Existing
model Archetype {
  id     String   @id
  name   String
  key    String   // slug
  moves  NationMove[]  // archetypeId on NationMove
}

model NationMove {
  id          String    @id
  key         String
  name        String
  archetypeId String?   // when set, move is in this archetype's playbook
  archetype   Archetype? @relation(...)
}
```

**No new tables.** Playbook = `NationMove.findMany({ where: { archetypeId: player.archetypeId } })`.

## API Contracts

### getPlaybookForArchetype(archetypeId)

**Input**: `archetypeId: string`  
**Output**: `NationMove[]` — moves where archetypeId matches

### getPlaybookForPlayer(playerId)

**Input**: `playerId: string`  
**Output**: `NationMove[]` — moves for player's archetype; empty if no archetype

## User Stories

### P1: Playbook display

**As a player**, I want to see the moves in my Archetype's Playbook, so I know what I can do.

**Acceptance**: Character page, Archetype modal, or Playbook view shows moves for my archetype. Uses `getPlaybookForPlayer`.

### P2: Playbook in Ouroboros interview

**As an interviewer**, I want to show the Playbook after Archetype selection, so the player sees their moves before completing character creation.

**Acceptance**: Ouroboros `OUROBOROS_PLAYBOOK` node fetches and displays moves for selected archetype.

## Functional Requirements

- **FR1**: `getPlaybookForArchetype(archetypeId)` returns NationMoves with `archetypeId = archetypeId`
- **FR2**: `getPlaybookForPlayer(playerId)` returns playbook for `player.archetypeId`; [] if null
- **FR3**: Seed or verify NationMoves have `archetypeId` set for all 8 archetypes
- **FR4**: UI surfaces "Your Playbook" or "Moves for [Archetype]" where character/archetype is shown

## Dependencies

- [playbook-to-archetype-rename](../../playbook-to-archetype-rename/spec.md)
- [nation-move-profiles](../../nation-move-profiles/spec.md)
- [archetype-move-styles](../../archetype-move-styles/spec.md)
