# Plan: Backlog API Sync

## Summary

Add SpecKitBacklogItem model, GET/PATCH API, seed from BACKLOG.md, regen script, and backlog:fetch for cross-machine sync.

## Implementation

### 1. Schema

**File**: [prisma/schema.prisma](../../prisma/schema.prisma)

Add `SpecKitBacklogItem` model. Run `npm run db:sync`.

### 2. API Routes

**File**: `src/app/api/backlog/route.ts`

- GET: Query all SpecKitBacklogItem, return JSON.

**File**: `src/app/api/backlog/[id]/route.ts`

- PATCH: Update status. Use requireAdmin pattern from campaign-passage.

### 3. Seed Script

**File**: `scripts/seed-spec-kit-backlog.ts`

- Parse BACKLOG.md Objective Stack (regex for table rows).
- Upsert each row into SpecKitBacklogItem.
- Idempotent.

### 4. Regen Script

**File**: `scripts/regenerate-backlog-md.ts`

- Read all SpecKitBacklogItem from DB.
- Sort by priority.
- Rewrite Objective Stack table in BACKLOG.md.
- Preserve other sections (Bruised Banana, Certification Feedback).

### 5. Fetch Script

**File**: `scripts/backlog-fetch.ts`

- Fetch from `process.env.BACKLOG_API_URL` or `https://<vercel-project>.vercel.app/api/backlog`.
- Write to `.specify/backlog/items.json` or print.
- `npm run backlog:fetch`.

### 6. Package Scripts

**File**: [package.json](../../package.json)

- `backlog:seed`: tsx scripts/seed-spec-kit-backlog.ts
- `backlog:regen`: tsx scripts/regenerate-backlog-md.ts
- `backlog:fetch`: tsx scripts/backlog-fetch.ts

## File Impacts

| Action | Path |
|--------|------|
| Modify | prisma/schema.prisma |
| Create | src/app/api/backlog/route.ts |
| Create | src/app/api/backlog/[id]/route.ts |
| Create | scripts/seed-spec-kit-backlog.ts |
| Create | scripts/regenerate-backlog-md.ts |
| Create | scripts/backlog-fetch.ts |
| Modify | package.json |

## Verification

1. Run migration, seed. DB has items.
2. GET /api/backlog returns JSON.
3. PATCH (as admin) updates status.
4. backlog:regen rewrites BACKLOG.md.
5. backlog:fetch retrieves from API.
