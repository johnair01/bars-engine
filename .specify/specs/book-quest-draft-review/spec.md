# Spec: Book Quest Draft and Admin Review

## Purpose

Add an admin review step between AI analysis and publishing. Book-derived quests are created in **draft** status and must be reviewed and approved by an admin before they go live. Admins can edit quests (title, description, move type, allyship domain) before approving them.

**Problem**: The current flow allows immediate Publish after analysis. AI-extracted quests may need correction (typos, misclassified moves/domains, unclear instructions). Publishing without review risks low-quality content in the Quest Library.

**Terminology**: Draft = quest not yet visible to players; Approved = quest status 'active', eligible for Publish.

## User Stories

### Admin

- As an admin, I want book-derived quests to be created as drafts, so I can review them before they go live.
- As an admin, I want to edit a draft quest's title, description, move type, and allyship domain before approving it.
- As an admin, I want to approve or reject individual quests, so I control which quests appear in the published thread.
- As an admin, I want to approve all quests at once when they look good, so I can move quickly when the AI output is solid.
- As an admin, I want Publish to only include approved quests, so unapproved content never reaches players.

### Player

- As a player, I only see quests that an admin has approved, so the Quest Library stays curated.

## Functional Requirements

### FR1: Draft status for book-derived quests

- **FR1a**: `analyzeBook` MUST create CustomBar records with `status: 'draft'` (not 'active').
- **FR1b**: Draft quests MUST have `completionEffects` containing `{ source: 'library', bookId }` (unchanged).
- **FR1c**: Draft quests MUST NOT appear in player-facing Market, Library, or thread content.

### FR2: Admin review page

- **FR2a**: Admin page `/admin/books/[id]/quests` MUST list all draft quests for the book (status: draft, completionEffects contains bookId).
- **FR2b**: Each quest MUST show: title, description, moveType, allyshipDomain.
- **FR2c**: Admin MUST be able to edit title, description, moveType, allyshipDomain inline (or via edit form).
- **FR2d**: Admin MUST be able to approve a quest (status → 'active') or reject it (status → 'archived' or delete).
- **FR2e**: Admin MUST be able to "Approve all" to approve all draft quests for the book in one action.

### FR3: Publish gating

- **FR3a**: `createThreadFromBook` MUST only include CustomBars with `status: 'active'` and completionEffects containing bookId.
- **FR3b**: If no approved quests exist, Publish MUST return an error: "No approved quests. Review and approve quests first."
- **FR3c**: The "Publish" button on the books list MAY link to the review page when there are unapproved quests, or show a warning.

### FR4: Navigation and discovery

- **FR4a**: From `/admin/books`, when a book is "analyzed", show a "Review quests" link (in addition to or instead of Publish until approved).
- **FR4b**: "Review quests" navigates to `/admin/books/[id]/quests`.

## Non-functional Requirements

- Reuse existing CustomBar schema; `status` already supports string values (e.g. 'draft', 'active', 'archived').
- Ensure Market, getQuestLibraryContent, and thread queries exclude draft quests.
- Edit form should validate moveType and allyshipDomain against allowed enums.

## Out of Scope

- Bulk edit (e.g. change move type for all quests in a category).
- Version history or diff view for edits.
- AI re-analysis of rejected quests.

## Dependencies

- [Book-to-Quest Library](../book-to-quest-library/spec.md) Phase 2–3
- CustomBar model (existing)
- [book-analyze.ts](../../src/actions/book-analyze.ts)
- [book-to-thread.ts](../../src/actions/book-to-thread.ts)

## Reference

- [src/actions/book-analyze.ts](../../src/actions/book-analyze.ts)
- [src/actions/book-to-thread.ts](../../src/actions/book-to-thread.ts)
- [src/app/admin/books/](../../src/app/admin/books/)
