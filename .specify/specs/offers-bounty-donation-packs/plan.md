# Plan: Offers, Bounty Board, and Donation Packs

## Summary

Add Bounty Board (user-created offers with escrow staking for multiple completions and bigger payouts), distinguish system vs bounty quests in the Market, and introduce Donation Packs (booster-pack style BARs redeemable for vibeulons) so donation-to-vibeulon conversion is configurable with an arcade/raffle feel.

## Implementation

### 1. Schema

**File**: `prisma/schema.prisma`

- **CustomBar**: Add `stakedPool` (Int, default 0), `questSource` (String?, optional: 'system' | 'bounty')
- **BountyStake** (new model): `id`, `barId`, `vibulonId`, `playerId`, `createdAt` — links escrowed vibeulons to bounty
- **RedemptionPack** (new model): `id`, `instanceId`, `playerId`, `donationId`, `packType`, `status`, `vibeulonAmount`, `metadata`, `createdAt`, `redeemedAt`
- **Instance**: Add `packConfig` (String?, JSON)
- **Donation**: Add relation to RedemptionPack

**Alternative**: Use Vibulon.stakedOnBarId for escrow instead of BountyStake if simpler. Preference: BountyStake for audit clarity.

### 2. Bounty creation

**Files**: `src/actions/create-bar.ts`, `src/components/quest-creation/QuestWizard.tsx`

- QuestWizard: For public visibility, add "Bounty" mode — stake amount, max completions, reward per completion. Validate: stake >= maxCompletions * reward.
- createQuestFromWizard: Accept `reward`, `maxAssignments`, stake amount. Move N vibeulons to escrow (BountyStake or Vibulon.stakedOnBarId). Create CustomBar with `questSource: 'bounty'`, `stakedPool: N`, `maxAssignments`, `reward`.

### 3. Quest engine: pay from escrow

**File**: `src/actions/quest-engine.ts`

- For bounties (`questSource === 'bounty'` or `stakedPool > 0`): Pay from escrow instead of minting. Transfer `reward` vibeulons from escrow to completer. Decrement `stakedPool`. Enforce `maxAssignments` (count completed PlayerQuests; reject if at limit).

### 4. Market UX

**Files**: `src/actions/market.ts`, `src/app/bars/available/page.tsx`

- Add "Bounty" badge for quests with `questSource === 'bounty'` or `stakedPool > 0`. Keep "Certification" for `isSystem`.
- Optional: Filter/tab for Bounties vs System.

### 5. RedemptionPack + redeem action

**Files**: Create `src/actions/redeem-pack.ts`, extend `src/actions/donate.ts`

- `redeemPack(packId)`: Player claims pack, mints `vibeulonAmount` vibeulons, sets `status: 'redeemed'`, `redeemedAt: now()`.
- Admin action: `createPackForPlayer(instanceId, playerId, packType)` — create unredeemed pack (manual donation flow).

### 6. Stripe webhook (Phase 6, optional)

**File**: Create `src/app/api/stripe-webhook/route.ts`

- On `checkout.session.completed`, create Donation record and one or more RedemptionPack per tier. Requires STRIPE_WEBHOOK_SECRET. Defer until Stripe ready.

### 7. Wallet/Event: Your Packs UI

**Files**: `src/app/event/page.tsx`, `src/app/wallet/page.tsx` (or equivalent)

- Show "Your Packs" (unredeemed). "Open Pack" button → call redeemPack.

### 8. Verification quest

**File**: `scripts/seed-cyoa-certification-quests.ts`

- Add `cert-offers-bounty-packs-v1` — Twine story that walks through: create bounty, complete bounty, redeem pack. Narrative: preparing the party for the Bruised Banana Fundraiser.

## File structure

| Action | File |
|--------|------|
| Create | `src/actions/redeem-pack.ts` |
| Create | `src/actions/bounty.ts` (stake, create bounty) |
| Modify | `prisma/schema.prisma` |
| Modify | `src/actions/create-bar.ts` |
| Modify | `src/actions/quest-engine.ts` |
| Modify | `src/components/quest-creation/QuestWizard.tsx` |
| Modify | `src/actions/market.ts` |
| Modify | `src/app/bars/available/page.tsx` |
| Modify | `src/actions/donate.ts` |
| Modify | `src/app/event/page.tsx` |
| Optional | `src/app/api/stripe-webhook/route.ts` |

## Verification

- Create bounty with stake → appears on Market with Bounty badge
- Complete bounty → completer receives vibeulons from escrow
- Admin creates pack for player → player sees "Your Packs", opens pack → mints vibeulons
- Run `npm run seed:cert:cyoa` → cert-offers-bounty-packs-v1 appears

## Reference

- Spec: [.specify/specs/offers-bounty-donation-packs/spec.md](spec.md)
- Bruised Banana campaign: [.specify/specs/bruised-banana-donation/spec.md](../bruised-banana-donation/spec.md)
