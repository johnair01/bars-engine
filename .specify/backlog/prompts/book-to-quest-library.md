# Spec Kit Prompt: Book-to-Quest Library

## Role

You are a Spec Kit agent implementing the Book-to-Quest Library: PDF ingestion, AI analysis, and a Quest Library that players can browse and pull from to Grow Up.

## Objective

Implement per [.specify/specs/book-to-quest-library/spec.md](../specs/book-to-quest-library/spec.md). The Quest Library is a distinct content pool separate from player-created and story-engine quests. Players browse and pull quests/threads into their active journey.

## Requirements

- **Surfaces**: /admin/books (upload, extract, analyze, view thread), /library (browse, pull)
- **Mechanics**: PDF extraction, AI analysis (chunk → OpenAI → CustomBar), book-to-thread, getQuestLibraryContent, pullFromLibrary
- **Persistence**: Book model, QuestThread.bookId, CustomBar.completionEffects provenance
- **Verification**: cert-book-to-quest-library-v1 quest

## Deliverables

- [ ] Schema (Book, QuestThread.bookId)
- [ ] src/lib/pdf-extract.ts, src/actions/books.ts, src/actions/book-analyze.ts, src/lib/book-chunker.ts
- [ ] src/actions/book-to-thread.ts, src/actions/quest-library.ts
- [ ] Admin /admin/books page (upload, extract, analyze, publish)
- [ ] Player /library page (browse, filter, pull)
- [ ] Verification quest cert-book-to-quest-library-v1

## Game Language

Use: WHO (nation, playbook), WHAT (quests, BARs), WHERE (allyship domains), 4 moves (Wake Up, Clean Up, Grow Up, Show Up).
