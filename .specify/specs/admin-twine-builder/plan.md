# Implementation Plan: Admin Twine Adventure Builder

## Architecture & Database Changes

### 1. Prisma Schema Additions
We need formal tables to store the Twine graphs currently represented by static JSON files.
- `Adventure`
  - `id` (CUID)
  - `slug` (Unique string for URL routing, e.g., 'wake-up')
  - `title`, `description`
  - `status` (Enum: DRAFT, ACTIVE, ARCHIVED)
  - `visibility` (Enum: PUBLIC_ONBOARDING, PRIVATE_QUEST)
  - `startNodeId` (String, links to the first Passage)
- `Passage`
  - `id` (CUID)
  - `adventureId` (Relation)
  - `nodeId` (String, unique within Adventure, corresponds to Twine passage name)
  - `text` (String, Markdown + Macros)
  - `choices` (JSON array of `{ text, targetNodeId }`)
- `PlayerAdventureProgress` (Optional/Later, but good for persistence)
  - `playerId`, `adventureId`
  - `currentNodeId`
  - `stateData` (JSON of `campaignState` equivalent)

### 2. Generalizing CampaignReader
- The current `CampaignReader.tsx` statically queries `/api/campaigns/wake_up/[nodeId]`.
- We will modify it to accept an `adventureSlug`.
- We will create a generic `GET /api/adventures/[slug]/[nodeId]` that pulls from the database `Passage` table instead of the filesystem.

### 3. Server-Side Macro Execution
- The `processMacros` logic (currently in the React component for the unauthenticated `wake_up` flow) should be verified.
- For authenticated quests, we need a server action `submitAdventureChoice(adventureId, nodeId, choiceId, currentState)` that handles state mutation definitively (e.g., actually minting real vibeulons when `<<mint>>` is parsed).
- If a user is **unauthenticated** (like the public Wake-Up campaign), state accumulates strictly in the browser, and macros like `<<mint>>` are deferred until the final `CampaignAuthForm` submission (handled by `createCampaignPlayer` or similar).

### 4. Admin UI Surfaces
- **`/admin/adventures`**: List view of all Adventures.
- **`/admin/adventures/create`**: Form to create an Adventure and set its `startNodeId`.
- **`/admin/adventures/[id]`**: Detail view listing all Passages in that Adventure.
- **`/admin/adventures/[id]/passages/create`**: The raw text editor for authoring the Markdown/Twine text and defining the `choices` JSON.

## Verification
- Run Prisma db push to sync the new tables.
- Create an "Example Adventure" manually via the new `/admin/adventures` UI.
- Add two interconnected nodes via the UI.
- Navigate to `/campaign/example-adventure` and verify the `CampaignReader` successfully pulls from the DB and renders the text + choices.
