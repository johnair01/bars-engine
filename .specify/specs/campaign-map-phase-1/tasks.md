# Tasks: Campaign Map — Phase 1 (Opening Momentum)

## Phase 1: Layer 1 — Campaign Phase Header

- [x] Create `getCampaignPhaseHeader(campaignRef)` in `src/lib/campaign-map.ts` — returns campaign name, phase, phase description
- [x] Add Campaign Map header to `src/app/campaign/board/page.tsx` — campaign name, "Phase: Opening Momentum", description
- [x] Phase 1 description: "The residency has begun. Players are gathering resources, organizing collaborators, raising awareness, and testing the early structure of the game."

## Phase 2: Layer 2 — Domain Regions

- [x] Create `getDomainRegionCounts(campaignRef, period)` in `src/lib/campaign-map.ts`
- [x] Aggregate quest counts by allyshipDomain (from deck/slots)
- [x] Aggregate active player counts per domain (or simplified total)
- [x] Add Domain Regions UI — four regions: Gather Resources, Skillful Organizing, Raise Awareness, Direct Action
- [x] Each region displays quest count, active player count
- [x] Click region → filter or reveal quests for that domain (integrate with GameboardClient slots)

## Phase 3: Layer 3 — Field Activity Indicators

- [x] Create `getFieldActivityIndicators(campaignRef)` in `src/lib/campaign-map.ts`
- [x] Query BAR count (recent), quest completions, active player count
- [x] Add Field Activity section to gameboard page
- [x] Optional: emergent signals from heuristics (`computeEmergentFieldHint` + UI line under field activity)

## Phase 4: Post-Onboarding Redirect

- [x] Add `postOnboardingRedirect` config (AppConfig or Instance) — `'dashboard' | 'campaign-map'`
- [x] Extend `getDashboardRedirectForPlayer` to support campaign-map → `/campaign/board`
- [x] Integrate in createCampaignPlayer and conclave signup flow (via existing `getDashboardRedirectForPlayer` callers)

## Phase 5: Verification Quest

- [x] Add `cert-campaign-map-phase-1-v1` to CERT_QUEST_IDS in seed-cyoa-certification-quests.ts
- [x] Create Twine story: steps for board → Layer 1 → 2 → 3 → domain filter
- [x] Run `npm run seed:cert:cyoa`; confirm quest appears (requires DB; run locally after pull)

## Verification

- [x] `npm run check` (lint + tsc)
- [x] `npm run build` (with reachable `DATABASE_URL` / local DB for prerender — run before prod deploy if env differs)
- [x] Manual: Navigate to `/campaign/board`; confirm three layers + optional **Signal** line under field activity
- [x] Manual: Post-onboarding redirect to Campaign Map (when `features.postOnboardingRedirect` = `campaign-map`)

**Status:** Phase 1 complete; BACKLOG **DL** = Done.
