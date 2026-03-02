# Spec Kit Prompt: Book Quest Twine Export

## Role

Implement the Book Quest Twine Export per [.specify/specs/book-quest-twine-export/spec.md](../specs/book-quest-twine-export/spec.md).

## Objective

Provide an admin-only export of book quests as JSON for Twine adventure building. One-click download from the book quest review page.

## Requirements

- **Surfaces**: Book quest review page (`/admin/books/[id]/quests`)
- **Mechanics**: getBookQuestsForTwineExport returns { book, quests }; client triggers download
- **Persistence**: Read-only; no schema changes
- **Verification**: Export a published book; verify JSON has correct structure and order

## Deliverables

- [ ] .specify/specs/book-quest-twine-export/spec.md
- [ ] .specify/specs/book-quest-twine-export/plan.md
- [ ] .specify/specs/book-quest-twine-export/tasks.md
- [ ] Implementation: action + Export button

## Reference

- Spec: [.specify/specs/book-quest-twine-export/spec.md](../specs/book-quest-twine-export/spec.md)
- Dependencies: [Book Quest Enhancements](../specs/book-quest-enhancements/spec.md)
