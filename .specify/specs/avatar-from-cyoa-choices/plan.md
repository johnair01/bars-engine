# Plan: 2D Sprite Avatar from CYOA Choices

## Summary

Add avatarConfig to Player, derive it on character creation from nation/playbook/domain, create an Avatar component with fallback, and surface it in dashboard, profile, and quest cards. v1 uses config keys (no sprite assets); placeholder or initials fallback.

## Phase 1: Schema and Derivation

### 1.1 Schema

**File**: `prisma/schema.prisma`

- Add `avatarConfig String?` to Player model

### 1.2 Derivation logic

**File**: `src/lib/avatar-utils.ts` (new)

- `deriveAvatarConfig(nationId?, playbookId?, campaignDomainPreference?): AvatarConfig | null`
- Map nation/playbook IDs to slugs (or use first 8 chars of id as key for v1)
- Return JSON string for storage

### 1.3 Character creation integration

**File**: `src/app/campaign/actions/campaign.ts`

- After applying nation/playbook/domain to player, call deriveAvatarConfig
- Store avatarConfig in player update

**File**: `src/actions/conclave.ts` (guided flow)

- When guided flow sets nation/playbook, derive and store avatarConfig

## Phase 2: Avatar Component

### 2.1 Avatar component

**File**: `src/components/Avatar.tsx` (new)

- Props: `player: { name, avatarConfig?, id? }` or `{ name, avatarConfig }`
- If avatarConfig: render placeholder (colored circle with nation/playbook initial, or generic icon)
- Else: render initials from name
- Size variants: sm, md, lg (default md)

### 2.2 v1 sprite strategy

- No sprite assets in v1. Use CSS-based placeholder: colored circle with 1–2 letter abbreviation (nation first letter, playbook first letter) or a generic icon.
- avatarConfig stores keys; component maps keys to colors (e.g. nationId → hue).

## Phase 3: Display Surfaces

### 3.1 Dashboard header

**File**: `src/app/page.tsx` (logged-in dashboard)

- Add Avatar next to player name in header

### 3.2 Profile

**File**: Profile page (if exists) or player card components

- Display Avatar prominently

### 3.3 Quest cards

**File**: Quest card components (e.g. `QuestDetailModal`, `QuestCard`)

- Show Avatar for quest creator or assignee when applicable

## Phase 4: Verification Quest

### 4.1 Seed

**File**: `scripts/seed-cyoa-certification-quests.ts`

- Add `cert-avatar-from-cyoa-v1`: steps: play BB CYOA (nation, playbook, domain), sign up, confirm avatar appears in dashboard/profile.

## File Structure

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` |
| Create | `src/lib/avatar-utils.ts` |
| Create | `src/components/Avatar.tsx` |
| Modify | `src/app/campaign/actions/campaign.ts` |
| Modify | `src/actions/conclave.ts` (if guided flow sets nation/playbook) |
| Modify | `src/app/page.tsx` |
| Modify | Quest card components |
| Modify | `scripts/seed-cyoa-certification-quests.ts` |

## Verification

- Create player via CYOA with nation/playbook/domain → avatarConfig stored
- Dashboard shows avatar (or initials)
- `npm run seed:cert:cyoa` seeds cert-avatar-from-cyoa-v1

## Reference

- Spec: [.specify/specs/avatar-from-cyoa-choices/spec.md](spec.md)
- Depends on: [lore-cyoa-onboarding](../lore-cyoa-onboarding/spec.md)
