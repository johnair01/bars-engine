# Spec: Book Quest Enhancements

## Purpose

Extend the book quest review flow with: (1) admin-configurable vibeulon reward per quest, (2) Game Master face tagging for growUp quests (dojo alignment), (3) upgrade-quest-to-thread for when multiple threads emerge, and (4) Twine-ready metadata for future adventure stringing.

**Extends**: [Book Quest Draft and Admin Review](../book-quest-draft-review/spec.md)

**Context**: BOOK quests generate BARs as loot; when a BAR pays down an active story quest it's worth a vibeulon. Admins should control quest value. Game Master faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage) run the allyship dojo—players go there for skill-building with vibeulons. Grow Up quests should tag which face is privileged. Quests may need upgrading to threads when multiple threads become obvious. Twine adventures will guide players through book quests; we need rich metadata for stringing.

## User Stories

### Admin

- As an admin, I want to set how many vibeulons a quest is worth in the review pane, so I can calibrate reward for difficulty or impact.
- As an admin, I want to tag which Game Master face a growUp quest privileges, so players can find dojo-aligned skill-building content.
- As an admin, I want to upgrade a single quest into a new thread when multiple threads emerge, so I can expand that quest into a fuller journey.
- As an admin, I want approved quests visible with an "Upgrade to thread" action, so I can create threads from individual quests.

### Future (Twine)

- As a content author, I want quest metadata (bookId, moveType, allyshipDomain, gameMasterFace, reward) available for Twine adventure stringing, so I can build guided experiences from the Quest Library.

## Functional Requirements

### FR1: Vibeulon reward in review pane

- **FR1a**: Admin MUST be able to edit `reward` (vibeulons) per quest in the review pane.
- **FR1b**: `CustomBar.reward` already exists; `updateBookQuest` MUST persist `reward` when provided.
- **FR1c**: Reward MUST be clamped to a reasonable range (e.g. 0–99).
- **FR1d**: Quest completion MUST use `quest.reward` for vibeulon minting (existing behavior in quest-engine).

### FR2: Game Master face for growUp quests

- **FR2a**: `CustomBar` MUST have `gameMasterFace String?` (values: shaman, challenger, regent, architect, diplomat, sage).
- **FR2b**: Admin MUST be able to set `gameMasterFace` when `moveType === 'growUp'`; field is optional.
- **FR2c**: The face dropdown MUST only appear in the edit form when moveType is growUp.
- **FR2d**: Faces align with allyship dojo; players seeking skill-building can filter by face.

### FR3: Upgrade quest to thread

- **FR3a**: Admin MUST be able to create a new QuestThread from a single quest via "Upgrade to thread" button.
- **FR3b**: The new thread MUST have the quest at position 1; admin can add more quests via existing journeys admin.
- **FR3c**: Thread MUST have `creatorType: 'admin'`, title `"[Quest Title] Thread"`, no `bookId`.
- **FR3d**: Approved quests MUST be displayed with an "Upgrade to thread" action.

### FR4: Twine-ready metadata

- **FR4a**: Quest metadata MUST include: title, description, moveType, allyshipDomain, gameMasterFace, reward, completionEffects (bookId, source).
- **FR4b**: No new API in this phase; document schema for future Twine export.
- **FR4c**: Ensure completionEffects keeps `{ source: 'library', bookId }` for library quests.

## Non-functional Requirements

- Reuse existing `CustomBar.reward`; no schema change for reward.
- Add only `gameMasterFace` to schema; run `db:sync` after migration.
- "Upgrade to thread" creates a standalone thread; quest may remain in both book thread and new thread.

## Out of Scope

- Twine export API or endpoint (future phase).
- Chunk-level provenance (chunkIndex) in completionEffects (future phase).
- Verification quest for this feature (admin-only; no player-facing UX).

## Dependencies

- [Book Quest Draft and Admin Review](../book-quest-draft-review/spec.md)
- [Game Master Face Sentences](../game-master-face-sentences/spec.md) (face definitions)
- CustomBar, QuestThread, ThreadQuest (existing)

## Reference

- [src/actions/book-quest-review.ts](../../src/actions/book-quest-review.ts)
- [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts) (reward usage)
- [.specify/specs/game-master-face-sentences/spec.md](../game-master-face-sentences/spec.md)
