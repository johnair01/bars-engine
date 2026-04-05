# Spec: Onboarding BARs in BARs Wallet (Not Marketplace)

## Purpose

Ensure BARs generated in the Bruised Banana onboarding flow appear in the player's BARs wallet and are **not** surfaced in the marketplace. The marketplace is for public quests; onboarding BARs are personal signals that belong to the creator's wallet.

**Problem**: Onboarding BARs are created with `visibility: 'public'`. The marketplace (`/bars/available`) queries `visibility: 'public', isSystem: false`, so onboarding BARs currently appear there as claimable quests. They should instead be in the creator's BARs wallet only.

**Goal**: Onboarding BARs → creator's wallet. Marketplace → player-created quests only (exclude onboarding).

## Current State

- **createOnboardingBar** / **finalizePendingBar** (`src/actions/onboarding-bar.ts`): Create CustomBar with `visibility: 'public'`, `type: 'vibe'`, `completionEffects` containing `onboarding: true`.
- **getMarketQuests** (`src/actions/market.ts`): Returns CustomBars where `visibility: 'public', status: 'active', isSystem: false` — includes onboarding BARs.
- **BARs wallet** (`/bars`, `/hand`): Shows creator's BARs and active quests. Creator's BARs (creatorId = playerId) already appear here.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Exclusion from marketplace** | Exclude onboarding BARs from marketplace query. Use `completionEffects` containing `onboarding: true` or add explicit field (e.g. `sourceType: 'onboarding'`) to filter. |
| **Visibility** | Option A: Keep `visibility: 'public'` but exclude from market. Option B: Use `visibility: 'private'` for onboarding BARs so they never surface anywhere except creator's wallet. Prefer Option A if we want onboarding BARs discoverable in Library later; Option B if strictly wallet-only. |
| **Schema** | Minimal change: filter in query. Optional: add `sourceType` or `isOnboardingBar` to CustomBar for clearer semantics. |

## Functional Requirements

### FR1: Exclude Onboarding BARs from Marketplace

- Marketplace query (`getMarketQuests` or equivalent) MUST exclude CustomBars where `completionEffects` contains `"onboarding":true` (or equivalent marker).
- Alternative: Add `sourceType: 'onboarding'` to CustomBar; exclude where `sourceType === 'onboarding'`.

### FR2: Onboarding BARs in Creator's Wallet

- Creator's BARs (including onboarding BARs) MUST appear in `/bars` and `/hand` when `creatorId === playerId`.
- No change required if dashboard/hand already fetches by creatorId or activeBars; verify onboarding BARs are included.

### FR3: Onboarding BAR Creation Unchanged (Except Optional Field)

- `createOnboardingBar` and `finalizePendingBar` continue to create CustomBar with same semantics.
- If using `sourceType`, set `sourceType: 'onboarding'` when creating onboarding BARs.

## Non-Functional Requirements

- Backward compatible: existing onboarding BARs (with `completionEffects` containing `onboarding: true`) are excluded from market after fix.
- No breaking changes to onboarding flow.

## Dependencies

- [Campaign Onboarding Twine v2](.specify/specs/campaign-onboarding-twine-v2/spec.md) — BAR creation at Claim step
- [Market Redesign for Launch](.specify/specs/market-redesign-launch/spec.md) — Marketplace shows player-created quests only

## Non-Goals (v0)

- Moving onboarding BARs to Library (separate spec: Public BARs in Library)
- Changing onboarding BAR visibility to private (can revisit if exclusion is insufficient)
