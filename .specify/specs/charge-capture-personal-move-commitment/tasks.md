# Tasks: Charge capture — personal move commitment

Spec: [spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## Audit

- [x] **PCM-0.1** Document 321 → quest / BAR / fuel / daemon data flow — [AUDIT.md](./AUDIT.md)

## Data & generator

- [x] **PCM-1.1** Add `personal_move` to charge `inputs` in `createChargeBar` + `CreateChargeBarPayload`.
- [x] **PCM-1.2** Parse `personal_move` in `generateQuestSuggestionsFromCharge` and pass to `generateQuestSuggestions`.
- [x] **PCM-1.3** Implement generator ordering: **chosen move first**; emotion bias applies to remaining slots.
- [x] **PCM-1.4** Tests: `npm run test:charge-move` — [`declared-move.test.ts`](../../src/lib/charge-quest-generator/__tests__/declared-move.test.ts); `npm run test:charge-quest-generator` unchanged.

## UI

- [x] **PCM-2.1** Move picker on `/capture` (ChargeCaptureForm) — 2x2 grid, optional, with hint text.
- [x] **PCM-2.2** Transition ceremony shows chosen move label in brand color.
- [x] **PCM-2.3** Copy unchanged — existing suggestion labels already accurate. ChargeExploreFlow / unpack routes — remove misleading “choose your move” if still inaccurate.

## 321 + campaign + economy

- [x] **PCM-3.1** `run321FromCharge` / Shadow321: thread `personal_move` from charge BAR into quest wizard prefill + fuel metadata.
- [x] **PCM-3.2** Placement: one documented path “321 quest → gameboard slot with `campaignRef`” for BB instance.
- [x] **PCM-3.3** Vibeulon event metadata: `personal_move` when minted from 321/charge flows (if column/JSON allows).

## Verification

- [x] `npx tsc --noEmit` + eslint pass (no new errors)
- [ ] Full playtest (deferred — local DB required)
