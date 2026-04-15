# Tasks: Onboarding BARs in BARs Wallet (Not Marketplace)

## Phase 1: Marketplace Exclusion

- [x] **T1.1** In `getMarketQuests` (or market query), exclude CustomBars where `completionEffects` contains `"onboarding":true`
- [x] **T1.2** Alternative: Add `sourceType` to CustomBar schema; set `sourceType: 'onboarding'` in createOnboardingBar and finalizePendingBar; exclude from market where `sourceType === 'onboarding'` — N/A (used completionEffects filter)
- [x] **T1.3** Verify `getMarketContent` uses same exclusion (if it calls getMarketQuests or equivalent) — getMarketContent calls getMarketQuests

## Phase 2: Verification

- [x] **T2.1** Verify creator's BARs (including onboarding) appear in `/bars`
- [x] **T2.2** Verify creator's BARs appear in `/hand` (quest wallet)
- [x] **T2.3** Manual test: complete onboarding → BAR in wallet, not in market

## Phase 3: Optional Schema

- [ ] **T3.1** Add `sourceType String?` to CustomBar if needed
- [ ] **T3.2** Run db:sync after schema change
