# Plan: Mobile UI Redesign (Game Loop + Deftness)

## Overview

Align Mobile UI with the game loop. BAR Card as foundation. Merge Forge + Charge Capture. BARs Deck and Campaign Deck naming. API-first: getBarCardData, mapCustomBarToBarCardData before UI.

## Phases

### Phase 0: Conversion Layer (Pre-Phase 1)

1. **BarCardData type**
   - Add to `src/lib/bar-card-data.ts` or `src/features/bar-system/types`
   - Fields: id, title, description, type, chargeType, createdAt, creatorName, status

2. **mapCustomBarToBarCardData**
   - Parse inputs JSON safely
   - chargeType from emotion_channel for charge_capture; else 'neutrality'
   - Handle malformed inputs

3. **getBarCardData**
   - Server Action in `src/actions/bar-card-data.ts`
   - Fetch CustomBar with creator; access check (owner/recipient/public)
   - Return mapped BarCardData

4. **Proof of concept**
   - Use getBarCardData in BAR Detail page (optional; or defer to Phase 1)

### Phase 1: BarCard Component

1. **BarCard component**
   - Create `src/components/bar-card/BarCard.tsx`
   - Props: data, variant (compact | full | flip | export)
   - Edge glow by chargeType (5-element palette)
   - Poker-card proportions, paper texture

2. **Migrate first consumer**
   - RecentChargeSection or BAR Detail

### Phase 2: The Forge

1. Merge ChargeCaptureForm and CreateBarForm
2. Create `/forge` or repurpose `/capture` as The Forge
3. Update nav links

### Phase 3: BAR Detail + Flip

1. BAR Detail uses BarCard full variant
2. Flip interaction

### Phase 4: Deck Grids

1. BARs Deck and Campaign Deck use BarCard compact
2. Rename Market → Campaign Deck in UI

### Phase 5: Share Image Export

1. exportBarCardAsImage or client canvas
2. Share flow

## File Impact

| File | Change |
|------|--------|
| `src/lib/bar-card-data.ts` | New — BarCardData type, mapCustomBarToBarCardData |
| `src/actions/bar-card-data.ts` | New — getBarCardData Server Action |
| `src/components/bar-card/BarCard.tsx` | New — Phase 1 |
| `src/app/bars/[id]/page.tsx` | Use getBarCardData (Phase 1 or 3) |
| `src/components/charge-capture/RecentChargeSection.tsx` | Use BarCard (Phase 1) |
| `prisma/schema.prisma` | No change |

## Dependencies

- [Game Loop Integration](.specify/specs/game-loop-integration/spec.md)
- [Charge Capture UX](.specify/specs/charge-capture-ux-micro-interaction/spec.md)

## Verification

- `npm run build` — passes
- `npm run check` — passes
