# Plan: Charge Capture UX + Micro-Interaction v0

## Summary

Fast interface for converting a moment of felt charge into a BAR artifact. Design goal: under 10 seconds, 3–5 taps. Core principle: capture first, structure later.

## Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| createChargeBar | Done | src/actions/charge-capture.ts |
| getRecentChargeBars | Done | charge-capture.ts |
| generateQuestSuggestionsFromCharge | Done | charge-capture.ts + charge-quest-generator |
| run321FromCharge | Done | charge-capture.ts |
| archiveChargeBar | Done | charge-capture.ts |
| ChargeCaptureForm | Done | src/components/charge-capture/ChargeCaptureForm.tsx |
| Post-capture flow (Reflect, Explore, Act, Not now) | Done | ChargeCaptureForm |
| RecentChargeSection | Done | src/components/charge-capture/RecentChargeSection.tsx |
| Dashboard integration | Done | src/app/page.tsx |
| Capture entry in Explore modal | Done | src/components/dashboard/ExploreModal.tsx |
| BAR type charge_capture | Done | CustomBar.type |
| Share via /bars/[id] | Done | getBarDetail supports charge_capture |

## File Impacts

| File | Role |
|------|------|
| src/actions/charge-capture.ts | Server actions |
| src/components/charge-capture/ChargeCaptureForm.tsx | Capture UI |
| src/components/charge-capture/RecentChargeSection.tsx | Dashboard section |
| src/components/charge-capture/ChargeExploreFlow.tsx | Explore → quest flow |
| src/app/capture/page.tsx | Capture page |
| src/app/capture/explore/[barId]/page.tsx | Explore page |
| src/components/dashboard/ExploreModal.tsx | Capture entry point |

## Dependencies

- Charge → Quest Generator (GE)
- 3-2-1 reflection (Shadow321Form)
- CustomBar schema
- bars.ts (getBarDetail, sendBar)
