# Plan: Onboarding BARs in BARs Wallet (Not Marketplace)

## Overview

Exclude onboarding BARs from the marketplace so they appear only in the creator's BARs wallet. Marketplace remains for player-created quests.

## Phases

### Phase 1: Marketplace Exclusion

- [ ] Exclude onboarding BARs from `getMarketQuests` (or `getMarketContent` source)
- [ ] Filter: `completionEffects` NOT containing `"onboarding":true`, OR add `sourceType` field and exclude `sourceType === 'onboarding'`
- [ ] Verify marketplace no longer shows onboarding BARs

### Phase 2: Verification

- [ ] Verify creator's onboarding BARs appear in `/bars` and `/hand`
- [ ] Test: complete onboarding → BAR created → visible in wallet, not in market

### Phase 3: Optional Schema (If Needed)

- [ ] Add `sourceType` to CustomBar if filtering by completionEffects is fragile
- [ ] Set `sourceType: 'onboarding'` in createOnboardingBar and finalizePendingBar

## Dependencies

- Campaign Onboarding Twine v2
- Market Redesign for Launch
