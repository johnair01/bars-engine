# Tasks: Offers, Bounty Board, and Donation Packs

## Phase 1: Schema
- [ ] Add `stakedPool`, `questSource` to CustomBar in prisma/schema.prisma
- [ ] Create BountyStake model (or use Vibulon.stakedOnBarId for escrow)
- [ ] Create RedemptionPack model
- [ ] Add `packConfig` to Instance
- [ ] Add Donation → RedemptionPack relation
- [ ] Run `npm run db:sync`

## Phase 2: Bounty creation
- [ ] Add Bounty mode to QuestWizard (stake amount, max completions, reward per completion)
- [ ] Validate stake >= maxCompletions * reward
- [ ] Update createQuestFromWizard to accept bounty params and move vibeulons to escrow
- [ ] Create CustomBar with questSource: 'bounty', stakedPool, maxAssignments, reward

## Phase 3: Quest engine
- [ ] In quest-engine.ts: For bounties, pay from escrow instead of minting
- [ ] Enforce maxAssignments (count completed PlayerQuests; reject if at limit)
- [ ] Transfer vibeulons from escrow to completer; decrement stakedPool

## Phase 4: Market UX
- [ ] Add "Bounty" badge to quest cards (questSource === 'bounty' or stakedPool > 0)
- [ ] Optional: Filter/tab for Bounties vs System

## Phase 5: Redemption packs
- [ ] Create redeem-pack.ts with redeemPack(packId) action
- [ ] Add admin createPackForPlayer action (manual donation flow)
- [ ] Add Instance.packConfig support for pack types

## Phase 6: Your Packs UI
- [ ] Add "Your Packs" section to /event or /wallet
- [ ] "Open Pack" button → redeemPack

## Phase 7: Stripe webhook (optional, when Stripe ready)
- [ ] Create api/stripe-webhook/route.ts
- [ ] On checkout.session.completed: create Donation + RedemptionPack(s)

## Phase 8: Verification quest
- [ ] Add cert-offers-bounty-packs-v1 to seed-cyoa-certification-quests.ts
- [ ] Twine story: create bounty, complete bounty, redeem pack. Narrative: Bruised Banana Fundraiser.

## Verification
- Run `npm run seed:cert:cyoa` — certification quest appears
- Create bounty → appears on Market with Bounty badge
- Complete bounty → completer receives vibeulons from escrow
- Admin creates pack → player opens pack → mints vibeulons
