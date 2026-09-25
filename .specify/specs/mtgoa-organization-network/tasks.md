# Tasks: MTGOA Organization + Campaign Network

**Input:** [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [public route contract](./contracts/public-routes.md)

## Phase 1 — Release 1 foundation

- [ ] T001 Create `src/lib/mastering-allyship/organization-state.ts` with public campaign types, Book Launch configuration, review metadata, and a validation helper that rejects open CTAs without a URL.
- [ ] T002 [P] Create `src/lib/mastering-allyship/__tests__/organization-state.test.ts` covering Book Launch’s 500-copy outcome, no blended units, no open action without route, and no public partner without a relationship type.
- [ ] T003 Create `src/app/organization/page.tsx` as a Server Component that reads only the public organization-state module and exports page-specific metadata.
- [ ] T004 Create `src/components/organization/OrganizationLanding.tsx` using existing BARS visual primitives/styles; render purpose, Book Launch, active routes, related surfaces, and status truthfully.
- [ ] T005 [US1] Add an explicit verified book-purchase route to the Book Launch card when configured; omit it when absent.
- [ ] T006 [US1] Add course, Book Tour Help, and nonprofit links only when their configuration says they are current.
- [ ] T007 [US1] Verify fresh-session desktop/mobile/keyboard behavior at `/organization` and validate metadata/OG output.

**Checkpoint:** User Story 1 is independently shippable. It has no database migration and no duplicate intake form.

## Phase 2 — Public campaign work

- [ ] T008 Confirm the Book Launch campaign slug, instance, steward, verified action routes, and first real work card with the Campaign Steward.
- [ ] T009 Add a validated public-work presentation shape to `MilestoneNeed`; create a Prisma migration only after T008 supplies real data.
- [ ] T010 [P] Add public-work validation tests: a card must have why-it-matters, concrete action, receipt prompt, canonical card ID, and access policy before display.
- [ ] T011 Create `src/app/organization/campaigns/[slug]/page.tsx` to render confirmed public campaign briefs and return `notFound()` for unavailable records.
- [ ] T012 Create `src/app/organization/campaigns/[slug]/work/page.tsx` to render only open, validated public work cards.
- [ ] T013 [US2] Connect public/self-directed cards to existing action routes and steward-routed cards to explicit CampaignLead contact consent.
- [ ] T014 [US3] Route “Bring an offer” into existing `offerToCollective` / `CollectiveOffer`; do not add a second lead model or form.
- [ ] T015 [US2] Verify public HTML/API never contains claimed participant identity, participant contact, or steward-only notes.

**Checkpoint:** User Stories 2 and 3 are independently shippable using an actual Book Launch need and the existing steward board.

## Phase 3 — Partner network and Deck Weaves

- [ ] T016 Confirm a real steward and brief before seeding each Book Tour, Speaking + Conferences, or Job Hunt child campaign.
- [ ] T017 [US4] Add reviewed partner-relationship configuration and `/organization` partner rendering; hide unconfirmed relationships.
- [ ] T018 Add a stewardship-interest route with campaign scope, decision rights, and explicit contact terms.
- [ ] T019 Add ordered Deck Weave configuration near a need/quest only when a real work card requires it; validate each canonical card ID.
- [ ] T020 Add aggregate campaign outcome display without global rankings, a public participant directory, or unified contribution scoring.

## Final verification

- [ ] T021 Run focused tests, repository type-check, and the existing route validation script.
- [ ] T022 Perform privacy review against the tables in `data-model.md` and route contract.
- [ ] T023 Campaign Steward reviews all public copy, statuses, links, and partner claims before merge.
