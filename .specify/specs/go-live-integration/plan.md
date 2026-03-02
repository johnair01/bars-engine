# Plan: Go-Live Integration

## Summary

Formalize the go-live process: verify loop:ready covers the checklist, add cert-go-live-v1 verification quest, and document pre-launch seed scripts. No schema changes; mostly documentation and one new cert quest.

## Implementation

### 1. Verify loop:ready coverage

**File**: `scripts/loop-readiness.ts`

- Confirm it runs: build, db:reset-history, core quest config, test:feedback-cap, db:feedback-cap-history.
- If any checklist item is missing, add it. Current script appears complete.
- No changes expected if already aligned.

### 2. Add verification quest cert-go-live-v1

**File**: `scripts/seed-cyoa-certification-quests.ts`

- Add `cert-go-live-v1` to CERT_QUEST_IDS.
- Add Twine story with passages:
  - START: "This certification quest verifies the go-live checklist. Prepare the Bruised Banana Fundraiser for launch."
  - STEP_1: Run `npm run loop:ready` (or loop:ready:quick). Confirm all checks pass. Link to [docs/LOOP_READINESS_CHECKLIST.md](/docs/LOOP_READINESS_CHECKLIST.md) if available, or describe.
  - STEP_2: Sign in as admin. Confirm you can access the dashboard.
  - STEP_3: Complete a quest (e.g. from Market or Adventures). Confirm vibeulons mint.
  - STEP_4: Open Wallet. Confirm balance reflects the minted vibeulons.
  - END_SUCCESS: "Verification complete. The core loop is ready for launch. Complete this quest to receive your vibeulon reward." (no link)
  - FEEDBACK: Report an issue (tags: feedback)
- Upsert TwineStory and CustomBar.
- Narrative: "Prepare the Bruised Banana Fundraiser for launch."

### 3. Pre-launch seed documentation

**File**: `docs/LOOP_READINESS_CHECKLIST.md` or new `docs/GO_LIVE.md`

- Add section "Pre-Launch Seeds" (or create GO_LIVE.md with this content):
  - Required seeds: seed:party, seed:quest-map, seed:cert:cyoa, seed:onboarding
  - Order: seed:party first (creates instance), then seed:quest-map (quest map), seed:onboarding (orientation threads), seed:cert:cyoa (certification quests)
  - When: Before first launch; re-run seed:cert:cyoa after adding new cert quests
- Link from LOOP_READINESS_CHECKLIST.md or merge into it.

### 4. Checklist alignment

**File**: `docs/LOOP_READINESS_CHECKLIST.md`

- Add or clarify in section 0: "Run `npm run loop:ready` for automated checks."
- Ensure Go/No-Go gate references both loop:ready and manual smoke.

## File structure

| Action | File |
|--------|------|
| Modify | `scripts/seed-cyoa-certification-quests.ts` |
| Modify | `docs/LOOP_READINESS_CHECKLIST.md` |
| Create (optional) | `docs/GO_LIVE.md` |

## Verification

- Run `npm run seed:cert:cyoa` → cert-go-live-v1 appears
- Run `npm run loop:ready` → all checks pass (or fail with clear output)
- Pre-launch seed doc exists and is accurate

## Reference

- Spec: [.specify/specs/go-live-integration/spec.md](spec.md)
- Loop readiness: [docs/LOOP_READINESS_CHECKLIST.md](../../docs/LOOP_READINESS_CHECKLIST.md)
