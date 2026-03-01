# Tasks: Lore Index + Event-Driven CYOA Onboarding

## Phase 1: Lore Index and Wiki

- [x] Create `content/lore-index.md` with canonical proper-noun list and slugs
- [x] Create `src/app/wiki/layout.tsx` (breadcrumb, back-to-app link)
- [x] Create `src/app/wiki/page.tsx` (index with links to all sections)
- [x] Create `src/app/wiki/campaign/bruised-banana/page.tsx`
- [x] Create `src/app/wiki/moves/page.tsx`
- [x] Create `src/app/wiki/domains/page.tsx`
- [x] Create `src/app/wiki/glossary/page.tsx`
- [x] Add "Learn more" link to Event page Wake Up section

## Phase 2: CYOA Content Pipeline

- [x] Extend `getBruisedBananaNode()` to optionally inject wiki links or "Learn more" choice
- [x] Add developmental assessment nodes (BB_Developmental_*)
- [x] Store developmental signal in storyProgress on sign-up
- [x] Update `assignOrientationThreads` to accept personalization params from campaignState
- [x] Add `cert-lore-cyoa-onboarding-v1` to seed-cyoa-certification-quests.ts

## Verification

- [x] `/wiki` displays index with links
- [x] `/wiki/campaign/bruised-banana` displays Bruised Banana lore
- [x] Event page has "Learn more" link
- [x] BB CYOA optionally links to wiki (Learn more choice, BB_LearnMore node)
- [x] `npm run seed:cert:cyoa` seeds cert-lore-cyoa-onboarding-v1
