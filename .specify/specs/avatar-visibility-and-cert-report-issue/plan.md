# Plan: Avatar Visibility Fix + Certification Report Issue

## Summary

1. **Avatar preview**: Show character (derived from playbook/archetype) during Build Your Character flow before completion.
2. **Avatar persistence**: Fix `autoCompleteQuestFromTwine` to run `processCompletionEffects` so `deriveAvatarFromExisting` executes on completion; avatar saved to dashboard.
3. **Report Issue**: Pass `threadId` through flow; audit cert quests; add Report Issue to Build Your Character.

## Phase 1: Avatar Preview (Before Completion)

### 1.1 Derive avatar on-the-fly for display

When `player.avatarConfig` is null but `player.nationId` and `player.playbookId` exist, derive avatar config for display without persisting. Options:
- Export `deriveAvatarConfig(player)` (or equivalent) from quest-engine — returns config object for rendering
- Or: add a server action / API that returns derived config for a player
- Or: pass nation/playbook to client and derive there (if logic is simple)

**File**: [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts) — `deriveAvatarConfig(nationId, playbookId, domainPreference?, options?)` already exists; use for read-only derivation (no db write).

**File**: [src/app/adventures/[id]/play/](../../src/app/adventures/[id]/play/) — play page or PassageRenderer receives player (or nation/playbook). When rendering Build Your Character passage, if player has nation+playbook but no avatarConfig, call `deriveAvatarConfig` and render Avatar component with derived config.

## Phase 2: Avatar Persistence (Twine Completion Effects)

### 2.1 Export or invoke processCompletionEffects from autoCompleteQuestFromTwine

**Option A (recommended)**: In `twine.ts`, import and call a new exported function from quest-engine that runs completion effects. The quest-engine has `processCompletionEffects` as a private async function. We need to either:
- Export it (or a wrapper) from quest-engine and call from twine.ts
- Or: have autoCompleteQuestFromTwine call `completeQuest` for the completion-effects portion (could cause double-reward; avoid)

**Option B**: Duplicate the effect-running logic in twine.ts — not ideal.

**Implementation**: Export `runCompletionEffectsForQuest(questId, playerId, inputs)` from quest-engine that fetches the quest, parses completionEffects, and runs processCompletionEffects (using db, not tx, since we're outside the main transaction). Call it from autoCompleteQuestFromTwine after updating PlayerQuest.

Actually: processCompletionEffects uses `tx` (transaction client). The autoCompleteQuestFromTwine runs outside a transaction. We have two choices:
1. Wrap the autoCompleteQuestFromTwine logic (including processCompletionEffects) in a db.$transaction
2. Run processCompletionEffects with `db` as the client (no transaction) — effects are independent updates

For simplicity, we can run processCompletionEffects with `db` directly. We need to export a function that takes (dbOrTx, playerId, quest, inputs). The quest-engine's processCompletionEffects takes `tx` as first param. We can pass `db` and it will work for single operations.

**File**: [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts)
- Export `processCompletionEffects` or create `runCompletionEffectsForQuest(playerId, questId, inputs)` that fetches quest and calls it with `db`

**File**: [src/actions/twine.ts](../../src/actions/twine.ts)
- In autoCompleteQuestFromTwine, after updating PlayerQuest and before return: fetch quest, if quest.completionEffects exists, call processCompletionEffects(db, playerId, quest, { completedViaTwine: true, runId })

### 2.2 Thread advancement when completing from Twine

**File**: [src/actions/twine.ts](../../src/actions/twine.ts)
- Add `threadId?: string | null` to `advanceRun` signature
- When questCompleted and threadId, call `advanceThreadForPlayer(playerId, threadId, questId)`
- Update PassageRenderer to pass threadId when calling advanceRun (it already has threadId in scope)

**File**: [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
- Pass threadId to advanceRun in handleChoice

## Phase 3: Certification Report Issue Audit

### 3.1 Audit seed-cyoa-certification-quests.ts

For each certification quest, verify:
- Every STEP_* and content passage has `{ label: 'Report Issue', target: 'FEEDBACK' }` in links
- FEEDBACK passage exists with tags: ['feedback']
- END_SUCCESS has no Report Issue (it's the final completion)

### 3.2 Add Report Issue to Build Your Character

**File**: [scripts/seed-onboarding-thread.ts](../../scripts/seed-onboarding-thread.ts)
- Add FEEDBACK passage to buildCharPassages
- Add Report Issue link to START passage: `links: [{ label: 'Confirm', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]`

## File Structure

| Action | File |
|--------|------|
| Modify | [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts) |
| Modify | [src/actions/twine.ts](../../src/actions/twine.ts) |
| Modify | [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx) |
| Modify | [src/app/adventures/[id]/play/](../../src/app/adventures/[id]/play/) — add avatar preview to Build Your Character passage |
| Modify | [scripts/seed-onboarding-thread.ts](../../scripts/seed-onboarding-thread.ts) |
| Audit/fix | [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts) |

## Verification

- Existing player with nation+playbook, no avatarConfig: open Build Your Character -> avatar preview visible before completion
- Existing player with nation+playbook, no avatarConfig: complete Build Your Character via Twine -> avatar appears on dashboard
- Admin with nation+playbook: same flow
- All cert quests: every step has Report Issue link
- Build Your Character: has Report Issue on START
