# Tasks: 321 EFA Integration

## Phase 1 — EFA Tool (done)

- [x] In `src/lib/emotional-first-aid.ts`: Replace `three-two-one-placeholder` with `shadow-321` tool (name: "321 Shadow Process", description: Face It / Talk to It / Be It)
- [x] Update VIBES_EMERGENCY_OPTIONS: change `suggestedToolKeys` from `three-two-one-placeholder` to `shadow-321` where applicable
- [x] ensureDefaultFirstAidTools now upserts; shadow-321 added on first EFA load

## Phase 2 — Kit Integration (done)

- [x] In EmotionalFirstAidKit: when `selectedTool?.key === 'shadow-321'`, render Shadow321Form (EFA mode) instead of FirstAidTwinePlayer
- [x] Pass `onComplete`, `embedded`, `contextQuestId` to Shadow321Form

## Phase 3 — Shadow321Form EFA Mode (done)

- [x] Add props: `onComplete?: (metadata: Metadata321) => void`, `embedded?: boolean`, `contextQuestId?: string | null`
- [x] When `onComplete` provided: post-321 prompt shows "Continue to resolution"; Create BAR opens in new tab and calls onComplete
- [x] When `embedded`: hide phase indicator; show "Continue to resolution" button
- [x] Post-321 prompt in EFA: Create BAR (Import), Create BAR (scratch), Continue to resolution

## Phase 4 — Gold Star Mint (done)

- [x] In completeEmotionalFirstAidSession: fetch tool by input.toolId; if `toolUsed?.key === 'shadow-321'`, mint 1 vibeulon (source: `shadow_321_completion`) in addition to delta mint
- [x] VibulonEvent notes: "321 Shadow Process completed (gold star)"
- [x] Vibulon originSource: `shadow_321_completion`, originTitle: "321 Shadow Process (gold star)"

## Phase 5 — Post-321 in EFA (done)

- [x] Post-321 prompt shown in EFA flow: Create BAR (Import), Create BAR (scratch), Continue to resolution
- [x] Create BAR opens in new tab; sessionStorage for Import metadata
- [x] contextQuestId passed to Shadow321Form for linkedQuestId in metadata

## Verification

- [x] Run `npm run build` and `npm run check`
- [ ] Manual: EFA → select 321 → complete 321 → complete resolution → verify 1 (or 2) vibeulons minted
- [ ] Manual: 321 → Create BAR → append to quest → complete quest → verify BAR creator mint
