# Tasks: Golden Path Campaign Landing

## Phase 1: Route and Data

- [x] Create `src/app/campaigns/[slug]/landing/page.tsx`
- [x] Implement `getCampaignLandingData(slug)` in `src/actions/campaign-landing.ts`
- [x] Resolve inviter from invite/player context

## Phase 2: Landing Card UI

- [x] Render campaign name, domain (friendly label), targetDescription
- [x] Render "X invited you" when inviter present
- [x] Single CTA: "Accept your first quest" linking to quest

## Phase 3: Verification

- [x] Run `npm run build` and `npm run check`
- [ ] Manual: navigate to /campaigns/bruised-banana/landing (or instance slug)
