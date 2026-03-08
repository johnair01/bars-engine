# Plan: Campaign Map — Phase 1 (Opening Momentum)

## Summary

Extend the gameboard at `/campaign/board` into a Campaign Map with three layers: (1) Campaign Phase Header, (2) Domain Regions, (3) Field Activity Indicators. The current gameboard is the MVP of Layer 1. Add post-onboarding redirect option to Campaign Map.

## Phases

### Phase 1: Layer 1 — Campaign Phase Header

- Enhance gameboard page header: campaign name, phase label, phase description.
- Create `getCampaignPhaseHeader(campaignRef)` or inline data. Phase 1 = "Opening Momentum" with fixed description.
- File: `src/app/campaign/board/page.tsx` — add Campaign Map header section above existing "Campaign Gameboard" / period text.

### Phase 2: Layer 2 — Domain Regions

- Create `src/lib/campaign-map.ts` — `getDomainRegionCounts(campaignRef, period)`.
- Aggregate: quests in deck/slots by `allyshipDomain`; active players per domain (PlayerQuest, TwineRun, or simplified count).
- Add Domain Regions UI to gameboard page: four clickable regions (Gather Resources, Skillful Organizing, Raise Awareness, Direct Action).
- Each region shows quest count, active player count.
- Click region → filter or reveal quests for that domain. Options: (a) filter existing slots by domain, (b) show modal/drawer with domain quests, (c) expand region to show slots.
- File: `src/app/campaign/board/GameboardClient.tsx` or new `CampaignMapClient.tsx` — domain regions + slot filtering.

### Phase 3: Layer 3 — Field Activity Indicators

- Create `getFieldActivityIndicators(campaignRef)` in `src/lib/campaign-map.ts`.
- Query: BAR count (recent), quest completions (recent), active player count. Optional: funding progress from Instance or config.
- Add Field Activity section to gameboard page. Observational only.
- Optional: emergent signals ("Curiosity rising", etc.) from heuristics (e.g. completion rate, BAR creation rate).

### Phase 4: Post-Onboarding Redirect

- Extend `getDashboardRedirectForPlayer` or add `postOnboardingRedirect` config.
- When config = `'campaign-map'`, redirect to `/campaign/board` after onboarding completion.
- Integrate in `campaign.ts` createCampaignPlayer flow and `conclave.ts` signup flow.

### Phase 5: Verification Quest

- Add `cert-campaign-map-phase-1-v1` to `scripts/seed-cyoa-certification-quests.ts`.
- Steps: complete onboarding → land on Campaign Map → confirm Layer 1, 2, 3 → click domain region.

## File Impacts

| File | Action |
|------|--------|
| `src/app/campaign/board/page.tsx` | Add Campaign Map layout; fetch phase header, domain counts, field indicators |
| `src/app/campaign/board/GameboardClient.tsx` | Integrate domain regions; optional slot filtering by domain |
| `src/lib/campaign-map.ts` | Create — getCampaignPhaseHeader, getDomainRegionCounts, getFieldActivityIndicators |
| `src/actions/config.ts` | Extend getDashboardRedirectForPlayer or add postOnboardingRedirect |
| `scripts/seed-cyoa-certification-quests.ts` | Add cert-campaign-map-phase-1-v1 |

## Data Model Notes

- `CustomBar.allyshipDomain` — GATHERING_RESOURCES | SKILLFUL_ORGANIZING | RAISE_AWARENESS | DIRECT_ACTION
- `GameboardSlot` — links to quest; quest has allyshipDomain
- Deck quests: from ThreadQuest + CustomBar with campaignRef; include allyshipDomain
- Active players: approximate via PlayerQuest (recent completions) or TwineRun; may simplify to total active in campaign

## Dependencies

- gameboard-campaign-deck (CV) — done
- gameboard-quest-generation (CY) — done
- campaign-kotter-domains (S) — done
- dashboard-orientation-flow (DG) — configurable redirect
