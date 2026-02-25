# Plan: In-App CYOA Editing

## Summary
Enable editing the Wake-Up campaign in Admin. Campaign page prefers DB when Adventure `wake-up` exists and is ACTIVE; otherwise falls back to files. Add Adventure startNodeId edit, passage edit page, and migration seed.

## Implementation

### 1. Campaign page: prefer DB
**File**: `src/app/campaign/page.tsx`
- Import `db` from `@/lib/db`
- Query `db.adventure.findFirst({ where: { slug: 'wake-up', status: 'ACTIVE' } })`
- If found and `adventure.startNodeId` is set, use it; else read from `map.json` as today
- Pass `startNodeId` to CampaignReader (already receives `initialNode` with `id`)

### 2. Adventure settings: edit startNodeId
**File**: `src/app/admin/adventures/[id]/page.tsx` (extend) or new edit section
- Add a form/section to set `startNodeId`: dropdown of `adventure.passages.map(p => p.nodeId)` or text input with validation
- Server action to update Adventure: `db.adventure.update({ where: { id }, data: { startNodeId } })`
- Revalidate path after update

### 3. Passage edit page
**Files**:
- Create `src/app/admin/adventures/[id]/passages/[passageId]/edit/page.tsx` — load passage, render EditPassageForm
- Create `src/app/admin/adventures/[id]/passages/[passageId]/edit/EditPassageForm.tsx` — form with nodeId, text, choices (same fields as CreatePassageForm)
- Create `src/app/admin/adventures/[id]/passages/[passageId]/edit/actions.ts` — `updatePassage` server action

### 4. Wake-Up migration seed
**File**: `scripts/seed-wake-up-adventure.ts`
- Load creator (first player)
- Read `content/campaigns/wake_up/map.json` for `startNodeId` and `nodes` array
- For each node in `nodes`, read `content/campaigns/wake_up/{nodeId}.json` (or equivalent structure)
- Upsert Adventure (slug `wake-up`, title "Wake-Up Campaign", status ACTIVE, startNodeId from map)
- Upsert Passages (adventureId, nodeId, text, choices from node JSON)
- Add npm script `seed:wake-up` in package.json

## File structure check
- Node files: `content/campaigns/wake_up/` — need to verify exact file naming (e.g. `Center_Witness.json` or `nodes/Center_Witness.json`)

## Verification
- With no `wake-up` Adventure: `/campaign` loads from file (unchanged behavior)
- Run `npm run seed:wake-up`: creates Adventure + Passages; `/campaign` loads from DB
- Edit passage in Admin → Adventures → [wake-up] → Edit: changes appear on `/campaign` after refresh
- Edit startNodeId in Adventure settings: campaign begins at new node

## npm script
- `npm run seed:wake-up` — seeds Wake-Up Adventure from file content
