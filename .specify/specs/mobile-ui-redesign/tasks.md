# Tasks: Mobile UI Redesign (Game Loop + Deftness)

## Phase 0: Conversion Layer

- [x] **T0.1** Create `src/lib/bar-card-data.ts` with BarCardData type and ChargeType
- [x] **T0.2** Implement `safeParseJson(inputs: string)` helper
- [x] **T0.3** Implement `mapCustomBarToBarCardData(bar)` — derive chargeType from inputs
- [x] **T0.4** Create `src/actions/bar-card-data.ts` with `getBarCardData(barId)` Server Action
- [x] **T0.5** Access check in getBarCardData (owner, recipient, or public)
- [x] **T0.6** Run `npm run build` and `npm run check` — fail-fix

## Phase 1: BarCard Component

- [x] **T1.1** Create `src/components/bar-card/BarCard.tsx` with data and variant props
- [x] **T1.2** Implement edge glow by chargeType (5-element palette: anger→red, joy→green, etc.)
- [x] **T1.3** Poker-card proportions, paper texture (CSS)
- [x] **T1.4** Migrate RecentChargeSection to use BarCard + getRecentChargeBarsAsCardData
- [x] **T1.5** Run build and check

## Phase 2: The Forge

- [x] **T2.1** Merge ChargeCaptureForm and CreateBarForm into unified Forge flow
- [x] **T2.2** Add Seal (quick) vs Forge (full) modes
- [x] **T2.3** Update nav: replace Capture and Create BAR with The Forge
- [x] **T2.4** Run build and check

## Phase 3: BAR Detail + Flip

- [x] **T3.1** BAR Detail page uses BarCard full variant
- [x] **T3.2** Add flip interaction (front/back)
- [x] **T3.3** Run build and check

## Phase 4: Deck Grids

- [x] **T4.1** BARs Deck (`/hand/deck`) uses BarCard compact
- [x] **T4.2** Campaign Deck (`/bars/available`) uses BarCard compact
- [x] **T4.3** Rename "Market" to "Campaign Deck" in UI
- [x] **T4.4** Run build and check

## Phase 5: Share Image Export

- [ ] **T5.1** Implement exportBarCardAsImage or client-side canvas
- [ ] **T5.2** Share flow produces image from BarCard
- [ ] **T5.3** Run build and check

## Verification Checklist

- [ ] getBarCardData returns BarCardData for charge_capture BAR with emotion_channel
- [ ] getBarCardData returns chargeType 'neutrality' for non-charge_capture BARs
- [ ] BarCard renders with correct edge glow
- [ ] Build and check pass
