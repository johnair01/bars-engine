# Tasks: Campaign Entry UI

## Phase 1: Schema and Server Action

- [x] Add `hasSeenCampaignEntry Boolean @default(false)` to Player in prisma/schema.prisma
- [x] Run npm run db:sync
- [x] Create `dismissCampaignEntry(playerId?)` server action in src/actions/onboarding.ts

## Phase 2: CampaignEntryBanner Component

- [x] Create src/components/campaign/CampaignEntryBanner.tsx (client component)
- [x] Implement props: nation, playbook, intendedImpact, starterQuests
- [x] Add "Enter the Flow" button with dismissCampaignEntry handler

## Phase 3: Home Page Integration

- [x] Fetch hasSeenCampaignEntry and bruised-banana-orientation-thread in page.tsx
- [x] Derive intendedImpact from storyProgress.lens or campaignDomainPreference
- [x] Conditionally render CampaignEntryBanner when showCampaignEntry

## Phase 4: Verification

- [x] Run npm run build and npm run check
- [ ] Manual: sign up via Bruised Banana with lens → see Campaign Entry → dismiss → no reappear
