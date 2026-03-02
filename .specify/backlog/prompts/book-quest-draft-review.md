# Spec Kit Prompt: Book Quest Draft and Admin Review

## Role

Implement admin review for book-derived quests before publishing. Quests start as drafts; admin edits and approves before they go live.

## Objective

Implement per [.specify/specs/book-quest-draft-review/spec.md](../specs/book-quest-draft-review/spec.md). Add draft status, review page, edit/approve/reject actions, and gate Publish on approved quests only.

## Requirements

- **Draft creation**: analyzeBook creates CustomBars with status: 'draft'
- **Review page**: /admin/books/[id]/quests lists draft quests, allows edit, approve, reject
- **Publish gating**: createThreadFromBook only includes status: 'active' quests
- **Navigation**: "Review quests" link from books list when analyzed

## Deliverables

- [ ] book-analyze: status 'draft'
- [ ] book-quest-review.ts actions
- [ ] book-to-thread: filter status active, error if none
- [ ] /admin/books/[id]/quests page
- [ ] BookList: Review quests link

## Reference

- Spec: [.specify/specs/book-quest-draft-review/spec.md](../specs/book-quest-draft-review/spec.md)
- Plan: [.specify/specs/book-quest-draft-review/plan.md](../specs/book-quest-draft-review/plan.md)
- Depends on: [Book-to-Quest Library](../specs/book-to-quest-library/spec.md)
