# Tasks: World Map — Campaign Deck, Periods, Portals, Spoke Sessions, Milestones

## Phase 1: Schema

- [x] Add `CampaignDeckCard` model to prisma/schema.prisma
- [x] Add `CampaignPeriod` model
- [x] Add `CampaignPortal` model
- [x] Add `SpokeSession` model
- [x] Add `CampaignMilestone` model
- [x] Add `MilestoneContribution` model
- [x] Extend `CustomBar`: add `spokeSessionId`, annotate existing `status` field with `seed` value
- [x] Run `npm run db:sync`

## Phase 2: Library

- [x] Create `src/lib/campaign-deck.ts` with types and pure functions
- [x] `buildDrawPool(allCards, usedCardIds)` — excludes previously drawn cards
- [x] `drawCards(pool, count)` — deterministic N-card draw
- [x] `hydratePortals(drawn)` — maps cards to slot 0–7
- [x] `isDonationPortalRequired(campaignRef)` — Gather Resources check
- [x] Types: `DeckCard`, `PeriodPortal`, `SpokeOutcome`, `MilestoneView`

## Phase 3: Actions

- [x] Create `src/actions/campaign-deck.ts`
- [x] `createDeckCard(input)` — author creates card for hexagram slot
- [x] `activateDeckCard(cardId)` — move card to active status
- [x] `drawPeriod(input)` — new period + 8 portals (no-repeat draw)
- [x] `getPeriodPortals(campaignRef)` — active portals with quest + CYOA
- [x] `startSpokeSession(portalId)` — create in-progress session
- [x] `completeSpokeSession(input)` — emit BAR seed + update portal count
- [x] `createMilestone(input)` — player proposes milestone
- [x] `approveMilestone(milestoneId)` — admin approval
- [x] `recordContribution(input)` — MilestoneContribution record + running total
- [x] `getMilestones(campaignRef, status)` — list milestones

## Phase 4: Verification

- [x] `npm run check` — 0 errors
- [x] `tsc --noEmit` — clean

## Phase 5: Admin Deck CYOA UI

- [x] `Instance.deckAuthoringIntake` JSON for last applied `DeckIntakeV1`
- [x] `src/lib/admin-campaign-deck-intake.ts` — `DeckIntakeV1`, wizard nodes, `materializeDeckFromIntake`
- [x] `src/actions/admin-campaign-deck.ts` — `getCampaignDeckAdminState`, `applyDeckIntakeV1`, `activateStarterDeckCards`, `drawCampaignPeriodAsAdmin`
- [x] Admin-gate `createDeckCard`, `activateDeckCard`, `drawPeriod` in `campaign-deck.ts`
- [x] `/admin/campaign/[ref]/deck` + `AdminCampaignDeckWizard.tsx`
- [x] Link from campaign author page → Deck CYOA wizard

## Phase 6: Deck wizard → Raise the urgency quests

- [x] `src/lib/campaign-deck-quests.ts` — `buildRaiseUrgencyQuestPayload`, `OWNER_GOAL_LINE_MAX_LEN`
- [x] `DeckIntakeV1.ownerGoalLine` + wizard step `owner_goal` + parse/finalize
- [x] `applyDeckIntakeV1` interactive transaction: create/update `CustomBar`, set `CampaignDeckCard.questId` (idempotent)
- [x] `revalidatePath('/admin/quests')` after apply
