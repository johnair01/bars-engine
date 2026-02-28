# Tasks: Event Donation Honor System

## Phase 1: Schema
- [x] Add venmoUrl, cashappUrl, paypalUrl to Instance
- [x] Add donationPackRateCents to Instance (default 100)
- [x] Add RedemptionPack model (instanceId, playerId, donationId, packType, status, vibeulonAmount)
- [x] Run db:sync

## Phase 2: Event Page
- [x] Remove Support the cause section
- [x] Remove ClaimSupportTokenButton
- [x] Add Donate link in Show Up
- [x] Add Donate link in fundraiser progress section (when goal > 0)

## Phase 3: Donation Page
- [x] Create /event/donate page
- [x] Show provider links (Venmo, CashApp, PayPal, Stripe)
- [x] Self-report form with amount input

## Phase 4: reportDonation Action
- [x] reportDonation(instanceId, amountCents)
- [x] If not logged in: set cookie, return requiresAuth + redirectTo
- [x] If logged in: create Donation + RedemptionPacks

## Phase 5: Post-Auth Hook
- [x] processPendingDonation(playerId) on donate page load
- [x] Login/sign-up returnTo support
- [x] Create Donation + Packs after auth, clear cookie

## Phase 6: Admin Instances
- [x] Add venmoUrl, cashappUrl, paypalUrl fields to form
- [x] Update upsertInstance to persist new fields

## Phase 7: Verification Quest
- [x] Create seed-event-donation-honor-cert.ts
- [x] Add npm run seed:cert:donation-honor

## Phase 8: Wallet Redemption
- [x] redeemPack action
- [x] RedemptionPacksSection component
- [x] Show unredeemed packs on wallet page
