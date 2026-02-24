# Implementation Steps

1. Configure Database Schema Additions
   - [x] Add `Adventure` and `Passage` models to `schema.prisma`.
   - [x] Run `npx prisma db push` and `npx prisma generate`.
2. Admin Dashboard Foundation
   - [x] Create `/src/app/admin/adventures/page.tsx` (List Adventures).
   - [x] Create `/src/app/admin/adventures/create/page.tsx` (Create new Adventure).
   - [x] Build Server Actions (`createAdventure`, `updateAdventureStatus`, `deleteAdventure`).
3. Passage Editor UI
   - [x] Create `/src/app/admin/adventures/[id]/page.tsx` (List Passages for specific Adventure).
   - [x] Create `/src/app/admin/adventures/[id]/passages/create/page.tsx` (Form for NodeID, Text, JSON Choices).
   - [x] Build Server Actions (`createPassage`, `updatePassage`, `deletePassage`).
4. Campaign Reader Refactoring
   - [x] Create `GET /api/adventures/[slug]/[nodeId]` API route.
   - [x] Modify `CampaignReader.tsx` to accept `adventureSlug` as a prop.
   - [x] Enable fetching from DB instead of local files.
5. End-to-End Testing
   - [ ] Manually create test nodes via Admin UI.
   - [ ] Map "start" to "end" with a dummy choice.
   - [ ] Render at `/campaign/[slug]`.
