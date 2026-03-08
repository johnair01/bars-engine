# Tasks: Campaign Map — Phase 1 (Opening Momentum)

## Phase 1: Layer 1 — Campaign Phase Header

- [ ] Create `getCampaignPhaseHeader(campaignRef)` in `src/lib/campaign-map.ts` — returns campaign name, phase, phase description
- [ ] Add Campaign Map header to `src/app/campaign/board/page.tsx` — campaign name, "Phase: Opening Momentum", description
- [ ] Phase 1 description: "The residency has begun. Players are gathering resources, organizing collaborators, raising awareness, and testing the early structure of the game."

## Phase 2: Layer 2 — Domain Regions

- [ ] Create `getDomainRegionCounts(campaignRef, period)` in `src/lib/campaign-map.ts`
- [ ] Aggregate quest counts by allyshipDomain (from deck/slots)
- [ ] Aggregate active player counts per domain (or simplified total)
- [ ] Add Domain Regions UI — four regions: Gather Resources, Skillful Organizing, Raise Awareness, Direct Action
- [ ] Each region displays quest count, active player count
- [ ] Click region → filter or reveal quests for that domain (integrate with GameboardClient slots)

## Phase 3: Layer 3 — Field Activity Indicators

- [ ] Create `getFieldActivityIndicators(campaignRef)` in `src/lib/campaign-map.ts`
- [ ] Query BAR count (recent), quest completions, active player count
- [ ] Add Field Activity section to gameboard page
- [ ] Optional: emergent signals from heuristics

## Phase 4: Post-Onboarding Redirect

- [ ] Add `postOnboardingRedirect` config (AppConfig or Instance) — `'dashboard' | 'campaign-map'`
- [ ] Extend `getDashboardRedirectForPlayer` to support campaign-map → `/campaign/board`
- [ ] Integrate in createCampaignPlayer and conclave signup flow

## Phase 5: Verification Quest

- [ ] Add `cert-campaign-map-phase-1-v1` to CERT_QUEST_IDS in seed-cyoa-certification-quests.ts
- [ ] Create Twine story: 6 steps (onboarding → Campaign Map → Layer 1 → Layer 2 → Layer 3 → click domain)
- [ ] Run `npm run seed:cert:cyoa`; confirm quest appears

## Verification

- [ ] Run `npm run build` and `npm run check`
- [ ] Manual: Navigate to /campaign/board; confirm three layers display
- [ ] Manual: Post-onboarding redirect to Campaign Map (when config set)
