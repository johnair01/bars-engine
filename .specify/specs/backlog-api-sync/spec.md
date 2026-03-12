# Spec: Backlog API Sync

## Purpose

Make the Spec Kit backlog sync across development environments without requiring git push. Database + REST API as source of truth; any machine fetches latest via `GET /api/backlog`. BACKLOG.md regenerated from DB for file-reading agents.

## Problem

- BACKLOG.md only syncs via git push/pull
- Working from multiple computers causes stale views
- Risk of duplicate work when switching machines

## User Stories

### P1: Fetch latest backlog from any machine
**As a developer**, I want to fetch the current backlog state from an API, so I see the latest status when switching computers without pulling first.

**Acceptance**: `GET /api/backlog` returns JSON of all items. `npm run backlog:fetch` fetches and saves to `.specify/backlog/items.json`. Use `npm run backlog:fetch -- --write-md` to also update BACKLOG.md from fetched data (for machines without DB).

### P2: Update backlog status
**As an admin**, I want to update a backlog item's status (e.g. Done, In-Progress), so the change is visible to all machines immediately.

**Acceptance**: `PATCH /api/backlog/:id` with `{ status }` updates the item. Requires admin. Response reflects new state.

### P3: Keep BACKLOG.md in sync
**As a developer**, I want BACKLOG.md regenerated from the database, so agents and skills that read the file see current state.

**Acceptance**: `npm run backlog:regen` reads from DB and rewrites the Objective Stack table in BACKLOG.md.

## Functional Requirements

- **FR1**: `SpecKitBacklogItem` model with id, priority, featureName, link, category, status, dependencies.
- **FR2**: `GET /api/backlog` returns all items as JSON. No auth.
- **FR3**: `PATCH /api/backlog/:id` updates status. Admin only.
- **FR4**: Seed script parses current BACKLOG.md and upserts into DB. Idempotent.
- **FR5**: Regen script reads DB and rewrites BACKLOG.md Objective Stack table.
- **FR6**: `npm run backlog:fetch` fetches from API (configurable URL).

## Schema

```prisma
model SpecKitBacklogItem {
  id           String   @id
  priority     Float    @default(0)
  featureName  String
  link         String?
  category     String   @default("UI")
  status       String   @default("Ready")
  dependencies String   @default("")
  updatedAt    DateTime @updatedAt

  @@map("spec_kit_backlog_items")
}
```

## Out of Scope (Phase 1)

- Admin UI for backlog
- Claim locking
- GitHub Integration

## Reference

- Plan: [plan.md](./plan.md)
- Tasks: [tasks.md](./tasks.md)
- Current backlog: [.specify/backlog/BACKLOG.md](../backlog/BACKLOG.md)
