# Quest Library ↔ Move Link

**Spec**: [move-ecology-emergent/spec.md](./spec.md) FR5a  
**Date**: 2026-03-17

## Conceptual Link

| Concept | Schema | Meaning |
|---------|--------|---------|
| **Quest** | `CustomBar.moveType` | wakeUp, cleanUp, growUp, showUp — which of the 4 moves this quest supports |
| **Quest exemplifies move** | Quest has `moveType`; NationMove has `sourceMetadata.moveType` or polarity→moveType mapping | A quest with moveType "wakeUp" exemplifies Wake Up moves (e.g. Call the Standard, awareness patterns) |
| **Quest Library thread** | `QuestThread` → `ThreadQuest` → `CustomBar` | Thread's `moveTypes` = union of quest moveTypes in that thread |
| **NationMove** | `NationMove` (key, name, effectsSchema.barKind) | Reusable pattern; applying it to a quest creates a BAR (Clarity, Prestige, or Framework) |

## Flow

1. **Book → Quest** — Book analysis extracts quests with `moveType`. Quest Library threads aggregate `moveTypes` from their quests.
2. **Quest Library browse** — Player filters by moveType (Wake Up, Clean Up, Grow Up, Show Up). Threads with matching moveTypes appear.
3. **Quest → Move** — When a player has a quest, they can apply a NationMove to it (via move panel). The move produces a BAR. Quests with `grantsMoveId` unlock that move on completion.
4. **Move → Quest** — A promoted NationMove (CANDIDATE/CANONICAL) can be linked to exemplar quests: quests with matching moveType from the same book (when move has `sourceMetadata.sourceBookId`).

## Implementation

- **Quest Library** (`/library`): `QuestThreadSummary.moveTypes` — aggregated from thread's quests. Filter UI filters threads by selected moveType.
- **Admin books → moves** (`/admin/books/[id]/moves`): Lists moves extracted from that book. Promote links move to CANDIDATE.
- **Instance move pool**: Campaign curates which moves are in play. Move panel shows only campaign pool when active instance has `moveIds`.
- **Quest grants move**: `CustomBar.grantsMoveId` — completing quest unlocks that NationMove for the player.

## Future: Explicit Exemplar Relation

A future schema could add `CustomBar.exemplarMoveId` or a junction table linking quests to NationMoves they exemplify. For MVP, the link is implicit: `moveType` on quest + `sourceMetadata.moveType` on move (for book-extracted moves).
