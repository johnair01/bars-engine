# Spec: In-App CYOA Editing

## Purpose
Enable editing of the pre-auth CYOA (Wake-Up campaign) directly in the app. Staff can change copy (text, choices) and the start node without touching files or deploying code. The campaign page reads from the database when an Adventure exists and is active; otherwise falls back to file-based content.

## User stories

### P1: Campaign reads from DB when available
**As an admin**, I want the campaign page to use Adventure + Passages from the database when an Adventure with slug `wake-up` exists and is ACTIVE, so that edits I make in Admin are reflected on `/campaign` without redeploying.

**Acceptance**: When Adventure `wake-up` is ACTIVE with `startNodeId` set, `/campaign` loads the start node from the DB. When no such Adventure exists or it is DRAFT, the page falls back to file-based `map.json`.

### P2: Edit Adventure start node
**As an admin**, I want to set or change the start node for an Adventure, so that I can control which passage the campaign begins with.

**Acceptance**: On the Adventure detail page (or settings), I can select/set `startNodeId` from existing passages and save. The campaign uses this when serving from DB.

### P3: Edit existing passages
**As an admin**, I want to edit passage text and choices for an Adventure, so that I can fix copy or change links without editing JSON files.

**Acceptance**: A passage edit page exists at `/admin/adventures/[id]/passages/[passageId]/edit`. I can update `nodeId`, `text`, and `choices` (JSON) and save.

### P4: Migrate Wake-Up content to DB
**As an admin**, I want a one-time migration that creates the `wake-up` Adventure and its Passages from the file-based content, so that I can then edit everything in the app.

**Acceptance**: A seed script reads `content/campaigns/wake_up/` (map.json + node files), creates Adventure with slug `wake-up` and status ACTIVE, creates Passages for each node, and sets `startNodeId`. Idempotent (upsert by slug/nodeId).

### P5: Verification quest (Bruised Banana Fundraiser)
**As a tester**, I want a certification quest that walks me through verifying in-app CYOA editing (edit passage in Admin, confirm on /campaign), so that I can validate the feature and earn vibeulons. The narrative frames this as preparing the party for the Bruised Banana Fundraiser.

**Acceptance**: A Twine story `cert-cyoa-editing-v1` linked to a CustomBar with `isSystem: true` appears on Adventures with the Certification badge. Completing it mints the reward.

## Functional requirements

- **FR1**: Campaign page (`src/app/campaign/page.tsx`) MUST check for an Adventure with slug `wake-up` and status `ACTIVE`. If found and `startNodeId` is set, use it. Otherwise fall back to `map.json`.
- **FR2**: Adventure detail/settings MUST allow editing `startNodeId` (dropdown or input of valid passage nodeIds).
- **FR3**: Passage edit route MUST exist at `/admin/adventures/[id]/passages/[passageId]/edit` with form for nodeId, text, choices.
- **FR4**: Seed script MUST create/update Adventure `wake-up` and Passages from file content. Idempotent.
- **FR5**: Verification quest `cert-cyoa-editing-v1` MUST be seeded by `npm run seed:cert:cyoa` (included in seed-cyoa-certification-quests.ts).

## Non-functional requirements

- Keep file-based fallback so static/version-controlled campaigns remain an option.
- No schema changes; use existing Adventure and Passage models.

## Out of scope (v1)
- i18n / multiple locales
- Visual graph editor for passage links
- Import/export of full campaign JSON

## Reference
- Campaign page: [src/app/campaign/page.tsx](../../src/app/campaign/page.tsx)
- CampaignReader: [src/app/campaign/components/CampaignReader.tsx](../../src/app/campaign/components/CampaignReader.tsx)
- Adventures API: [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- Admin Adventures: [src/app/admin/adventures/](../../src/app/admin/adventures/)
- File content: [content/campaigns/wake_up/](../../content/campaigns/wake_up/)
