# Spec: Book Quest Twine Export

## Purpose

Provide an export of book-derived quests with full metadata so content authors can build Twine adventures that guide players through the Quest Library. The export returns structured JSON with everything needed to string passages and link quests.

**Extends**: [Book Quest Enhancements](../book-quest-enhancements/spec.md)

**Context**: Twine adventures can reference quests via questId; when players complete passages they advance through the quest flow. The export gives authors: quest order, move type, allyship domain, Game Master face, reward, and narrative content (title, description) for each quest.

## User Stories

### Admin / Content Author

- As an admin, I want to export a book's quests as JSON for Twine adventure building, so I can use the metadata when creating passages.
- As an admin, I want the export to include quest order (from published thread or move order), so I know the intended sequence.
- As an admin, I want one-click download from the book quest review page, so I can quickly grab the context.

## Functional Requirements

### FR1: Export data shape

The export MUST include:

- **book**: `{ id, title, author }`
- **quests**: array of `{ id, title, description, moveType, allyshipDomain, gameMasterFace, reward, position }`
- **position**: 1-based index; from ThreadQuest if book has published thread, else derived from move order (wakeUp→cleanUp→growUp→showUp)

### FR2: Server action

- **FR2a**: `getBookQuestsForTwineExport(bookId: string)` MUST require admin.
- **FR2b**: MUST return only approved (status: active) quests with completionEffects containing bookId.
- **FR2c**: MUST order quests by thread position when book has a published thread; otherwise by move order, then createdAt.

### FR3: Admin UI

- **FR3a**: Book quest review page MUST have an "Export for Twine" button when the book has at least one approved quest.
- **FR3b**: Clicking the button MUST trigger a JSON download with filename `{book-slug}-quests.json`.

### FR4: Verification quest

- **FR4a**: A certification quest `cert-book-quest-twine-export-v1` MUST be seeded by `npm run seed:cert:cyoa`.
- **FR4b**: The quest MUST walk through: open /admin/books, open Review quests for a book with quests, approve at least one if needed, click Export for Twine, confirm JSON downloads with book + quests structure.

## Non-functional Requirements

- Export is admin-only; no public API.
- JSON is human-readable (no minification) for authoring workflows.

## Out of Scope

- Automatic Twine story generation from the export.
- Chunk-level provenance (chunkIndex) in export.
- Export of draft quests.

## Dependencies

- [Book Quest Enhancements](../book-quest-enhancements/spec.md)
- Book, CustomBar, QuestThread, ThreadQuest (existing)

## Reference

- [src/actions/book-quest-review.ts](../../src/actions/book-quest-review.ts)
- [src/actions/book-to-thread.ts](../../src/actions/book-to-thread.ts)
