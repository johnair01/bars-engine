# Spec: Offers, Bounty Board, and Donation Packs

## Purpose

Add a Bounty Board (user-created offers with staking for multiple completions and bigger payouts), distinguish system vs bounty quests in the Market, and introduce Donation Packs (Pokemon booster-style BARs redeemable for vibeulons) so donation-to-vibeulon conversion is configurable and has an arcade/raffle feel ahead of the residency launch.

## Conceptual Model (Game Language)

- **Energy** (vibeulons) flows when players complete bounties (from escrow) or redeem packs (from donation).
- **WHAT**: Bounties = user-created quests with staked Energy; system quests = admin/generated.
- **WHERE**: Bounties can be tagged with allyship domain; donation packs are instance-scoped.
- **Personal throughput**: Bounty creation = Show Up (putting Energy on the line); pack redemption = Wake Up (revealing Energy).

## User Stories

### P1: Create a bounty with staked vibeulons
**As a player**, I want to stake vibeulons on a public quest so others can complete it and earn my staked Energy — either allowing multiple completions or a bigger payout per completion.

**Acceptance**: QuestWizard (or equivalent) offers "Bounty" mode when creating public quests. I choose stake amount, max completions, and reward per completion. Constraint: stake >= maxCompletions * reward. Vibeulons move to escrow (not burned).

### P2: Complete a bounty and receive staked payout
**As a player**, I want to complete a bounty and receive the staked vibeulons as my reward, so my Show Up is rewarded with Energy from the bounty creator.

**Acceptance**: When I complete a bounty quest, I receive `reward` vibeulons from the escrow pool. No new minting; transfer from escrow to my wallet. Bounty tracks completions; when max reached or pool empty, bounty is fulfilled.

### P3: Distinguish bounties from system quests in the Market
**As a player**, I want to see which quests are user-created bounties vs system-generated, so I can choose what to pursue.

**Acceptance**: Market shows "Bounty" badge for quests with staked pool. "Certification" badge remains for system quests. Optional filter/tab for Bounties vs System.

### P4: Donate and receive packs (booster-pack feel)
**As a donor**, I want to receive BARs (packs) when I donate, so I can open them later to reveal my Energy — like Pokemon booster packs.

**Acceptance**: When donation succeeds (Stripe webhook or manual admin), I receive one or more RedemptionPacks. Packs appear in "Your Packs" on /event or /wallet. I can "Open Pack" to redeem and mint vibeulons.

### P5: Admin configures pack types and donation tiers
**As an admin**, I want to configure how many packs per donation tier and how many vibeulons each pack contains (fixed or variable), so we can tune the arcade/raffle feel.

**Acceptance**: Instance has `packConfig` (JSON). Pack types define vibeulon amount (fixed) or min/max (variable). Admin can create packs manually for players (e.g. after verifying offline donation).

### P6: Verification quest (Bruised Banana Fundraiser)
**As a tester**, I want a certification quest that walks me through creating a bounty, completing it, and redeeming a pack, so I can validate the feature and earn vibeulons. The narrative frames this as preparing the party for the Bruised Banana Fundraiser.

**Acceptance**: A Twine story `cert-offers-bounty-packs-v1` linked to a CustomBar with `isSystem: true` appears on Adventures. Completing it mints the reward.

## Functional Requirements

- **FR1**: CustomBar MUST support `stakedPool` (Int), `questSource` (String: 'system' | 'bounty'). Bounties have `questSource: 'bounty'` and `stakedPool > 0`.
- **FR2**: Bounty creation MUST move vibeulons to escrow (BountyStake or Vibulon.stakedOnBarId). Constraint: `stakedPool >= maxAssignments * reward`.
- **FR3**: Quest engine MUST pay from escrow for bounties (no mint). Enforce `maxAssignments` (count completed PlayerQuests).
- **FR4**: RedemptionPack model MUST exist with instanceId, playerId, packType, status (unredeemed/redeemed), vibeulonAmount, metadata.
- **FR5**: Instance MUST support `packConfig` (JSON) for pack types (vibeulonAmount or vibeulonMin/Max).
- **FR6**: `redeemPack(packId)` action MUST mint vibeulons and mark pack redeemed.
- **FR7**: Stripe webhook (when configured) MUST create Donation + RedemptionPack(s) on payment success.
- **FR8**: Verification quest `cert-offers-bounty-packs-v1` MUST be seeded by `npm run seed:cert:cyoa`.

## Non-functional Requirements

- Escrow design: Prefer BountyStake table for clarity over Vibulon.stakedOnBarId.
- Existing public quests: Leave as-is (legacy); new bounties use new flow.
- Stripe webhook: Phase 6 can be deferred until Stripe integration is ready.

## Out of Scope (v1)

- Variable pack contents beyond vibeulon amount (e.g. "rare" items).
- Admin UI for pack config (use Instance JSON for v1).

## Reference

- Cursor plan: offers_bounty_donation_packs (see BACKLOG)
- Quest creation: [src/actions/create-bar.ts](../../src/actions/create-bar.ts)
- Quest engine: [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts)
- Market: [src/actions/market.ts](../../src/actions/market.ts)
- Donation: [src/actions/donate.ts](../../src/actions/donate.ts)
- Instance: [prisma/schema.prisma](../../prisma/schema.prisma)
