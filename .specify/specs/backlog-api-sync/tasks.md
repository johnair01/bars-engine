# Tasks: Backlog API Sync

## Schema
- [x] Add SpecKitBacklogItem model to prisma/schema.prisma
- [x] Run npm run db:sync (or seed creates table if missing)

## API
- [x] Create GET /api/backlog route
- [x] Create PATCH /api/backlog/[id] route (admin)

## Scripts
- [x] Create scripts/seed-spec-kit-backlog.ts
- [x] Create scripts/regenerate-backlog-md.ts
- [x] Create scripts/backlog-fetch.ts
- [x] Add npm scripts to package.json

## Verification
- [x] Seed runs, DB populated
- [x] GET returns items
- [x] PATCH updates (admin)
- [x] Regen rewrites BACKLOG.md
- [x] Fetch retrieves from API (requires dev server or BACKLOG_API_URL)
