# Plan: World Map — Campaign Deck, Periods, Portals, Spoke Sessions, Milestones

**Spec:** [spec.md](./spec.md)

---

## Phase 1 — Schema

Add to `prisma/schema.prisma`:
1. `CampaignDeckCard` model
2. `CampaignPeriod` model
3. `CampaignPortal` model
4. `SpokeSession` model
5. `CampaignMilestone` model
6. `MilestoneContribution` model
7. Add `status` field to `CustomBar` (seed | draft | active | archived — extend existing)
8. Add `spokeSessionId` to `CustomBar` for provenance

Run `npm run db:sync`.

## Phase 2 — Library (src/lib/campaign-deck.ts)

Pure functions for deck draw logic:

- `buildDrawPool(allCards, usedCardIds)` — returns cards eligible for this period (excludes previously drawn)
- `drawCards(pool, count)` — deterministic draw of N cards
- `hydratePortals(period, cards)` — maps 8 cards to 8 portal slots
- `isDonationPortalRequired(campaignRef)` — returns true for Gather Resources campaigns
- Types: `DeckCard`, `PeriodPortal`, `SpokeOutcome`, `MilestoneView`

## Phase 3 — Actions (src/actions/campaign-deck.ts)

Server actions:

- `createDeckCard(input)` — campaign author creates a deck card for a hexagram
- `drawPeriod(campaignRef, instanceId?)` — admin/owner advances to new period, creates portals
- `getPeriodPortals(campaignRef)` — returns active period's portals hydrated with quest + CYOA info
- `startSpokeSession(portalId, playerId)` — creates SpokeSession in_progress
- `completeSpokeSession(sessionId, outcome)` — marks complete, emits BAR seed + quest
- `createMilestone(input)` — player proposes a milestone
- `approveMilestone(milestoneId, adminId)` — admin approves
- `recordContribution(input)` — records a MilestoneContribution

## Phase 4 — Verification

- `npm run build`
- `npm run check`

## File impacts

| File | Change |
|---|---|
| `prisma/schema.prisma` | +6 models, extend CustomBar |
| `src/lib/campaign-deck.ts` | new |
| `src/actions/campaign-deck.ts` | new |
