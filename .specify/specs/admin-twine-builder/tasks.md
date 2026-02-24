# Implementation Steps

1. Configure Database Schema Additions
   - [ ] Add `Adventure` and `Passage` models to `schema.prisma`.
   - [ ] Run `npx prisma db push` and `npx prisma generate`.
2. Admin Dashboard Foundation
   - [ ] Create `/src/app/admin/adventures/page.tsx` (List Adventures).
   - [ ] Create `/src/app/admin/adventures/create/page.tsx` (Create new Adventure).
   - [ ] Build Server Actions (`createAdventure`, `updateAdventureStatus`, `deleteAdventure`).
3. Passage Editor UI
   - [ ] Create `/src/app/admin/adventures/[id]/page.tsx` (List Passages for specific Adventure).
   - [ ] Create `/src/app/admin/adventures/[id]/passages/create/page.tsx` (Form for NodeID, Text, JSON Choices).
   - [ ] Build Server Actions (`createPassage`, `updatePassage`, `deletePassage`).
4. Campaign Reader Refactoring
   - [ ] Create `GET /api/adventures/[slug]/[nodeId]` API route.
   - [ ] Modify `CampaignReader.tsx` to accept `adventureSlug` as a prop.
   - [ ] Enable fetching from DB instead of local files.
5. End-to-End Testing
   - [ ] Manually create test nodes via Admin UI.
   - [ ] Map "start" to "end" with a dummy choice.
   - [ ] Render at `/campaign/[slug]`.
