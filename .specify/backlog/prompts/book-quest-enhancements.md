# Spec Kit Prompt: Book Quest Enhancements

## Role

You are implementing the Book Quest Enhancements spec per [.specify/specs/book-quest-enhancements/spec.md](../specs/book-quest-enhancements/spec.md).

## Objective

Extend the book quest review flow with: (1) admin-configurable vibeulon reward per quest, (2) Game Master face tagging for growUp quests, (3) upgrade-quest-to-thread, and (4) Twine-ready metadata. Implement from spec → plan → tasks.

## Requirements

- **Surfaces**: Admin book quest review page (`/admin/books/[id]/quests`), edit form, approved quests section
- **Mechanics**: reward (0–99), gameMasterFace (when growUp), createThreadFromQuest
- **Persistence**: CustomBar.gameMasterFace (new), CustomBar.reward (existing)
- **Verification**: Manual: edit → approve → complete quest (verify vibeulons); upgrade to thread → verify thread created

## Deliverables

- [ ] .specify/specs/book-quest-enhancements/spec.md
- [ ] .specify/specs/book-quest-enhancements/plan.md
- [ ] .specify/specs/book-quest-enhancements/tasks.md
- [ ] Implementation: schema, actions, UI

## Reference

- Spec: [.specify/specs/book-quest-enhancements/spec.md](../specs/book-quest-enhancements/spec.md)
- Plan: [.specify/specs/book-quest-enhancements/plan.md](../specs/book-quest-enhancements/plan.md)
- Dependencies: [Book Quest Draft and Admin Review](../specs/book-quest-draft-review/spec.md)
