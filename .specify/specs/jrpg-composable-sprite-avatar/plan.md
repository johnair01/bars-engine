# Plan: JRPG Composable Sprite Avatar + Build-a-Bear Onboarding

## Summary

Extend avatar system with composable parts (base, nation_body, nation_accent, playbook_outfit, playbook_accent). Use name-based slugs for stable part paths. Add OnboardingAvatarPreview to CampaignReader for progressive layer unlock during BB flow. Update Avatar component to render layered images with fallback.

## Phase 1: Avatar Parts Module + Config Extension

### 1.1 avatar-parts.ts

**File**: `src/lib/avatar-parts.ts` (new)

- `PartLayer` type: base | nation_body | nation_accent | playbook_outfit | playbook_accent
- `PartSpec` type: { layer, key, path }
- `getAvatarPartSpecs(config: AvatarConfig): PartSpec[]` — ordered specs for full avatar
- `getUnlockedLayersForNode(nodeId, campaignState): PartLayer[]` — which layers to show at current step
- `getAvatarPartSpecsForProgress(config, unlockedLayers): PartSpec[]` — filter specs by unlocked layers

### 1.2 avatar-utils.ts extension

**File**: `src/lib/avatar-utils.ts`

- Extend `AvatarConfig` with `genderKey?: 'male' | 'female' | 'neutral' | 'default'`
- Add `deriveGenderFromPronouns(pronouns?: string | null): AvatarConfig['genderKey']`
- Add `slugifyName(name: string): string` (e.g. "The Bold Heart" → "bold-heart")
- Change `deriveAvatarConfig` to accept optional `nationName`, `playbookName` for name-based keys; when only ids given, caller must resolve (or keep id-based for backward compat, migrate in campaign flow)

### 1.3 Stable keys in character creation

**File**: `src/app/campaign/actions/campaign.ts`

- When applying nation/playbook, fetch Nation and Playbook records
- Pass `nation.name`, `playbook.name` to deriveAvatarConfig (or new `deriveAvatarConfigFromNames`)
- Store avatarConfig with nationKey, playbookKey from slugifyName

## Phase 2: BB API — nationKey and playbookKey Macros

### 2.1 BB_SetNation_* and BB_SetPlaybook_*

**File**: `src/app/api/adventures/[slug]/[nodeId]/route.ts`

- For `BB_SetNation_<id>`: Look up Nation by id, get name, slugify → nationKey. Add `<<set $nationKey = "${nationKey}">>` to node text (in addition to existing nationId).
- For `BB_SetPlaybook_<id>`: Look up Playbook by id, get name, slugify → playbookKey. Add `<<set $playbookKey = "${playbookKey}">>` to node text.

## Phase 3: Avatar Component — Layered Rendering

### 3.1 Avatar.tsx

**File**: `src/components/Avatar.tsx`

- Import `getAvatarPartSpecs`, `parseAvatarConfig` from avatar-utils/avatar-parts
- If config exists: get part specs, render container with stacked `<img>` layers (position: absolute, same size)
- Each img: `onError` → hide layer (use state or CSS)
- If no config or all layers fail: render existing initials fallback
- Maintain size variants (sm, md, lg)

### 3.2 Asset directory

**Directory**: `public/sprites/parts/`

- Create base/, nation_body/, nation_accent/, playbook_outfit/, playbook_accent/
- Add placeholder or single default.png for base (optional; fallback works without assets)

## Phase 4: OnboardingAvatarPreview + CampaignReader

### 4.1 OnboardingAvatarPreview

**File**: `src/app/campaign/components/OnboardingAvatarPreview.tsx` (new)

- Props: `campaignState`, `currentNodeId`, `campaignRef?`
- Build partial config from campaignState (nationKey, playbookKey, genderKey: 'default')
- Call `getUnlockedLayersForNode(currentNodeId, campaignState)`
- Call `getAvatarPartSpecsForProgress(config, unlockedLayers)`
- Render same layered img stack as Avatar; fallback to initials/silhouette
- Optional: "Your character" label

### 4.2 CampaignReader integration

**File**: `src/app/campaign/components/CampaignReader.tsx`

- When `campaignRef === 'bruised-banana'` and not on signup node: render OnboardingAvatarPreview
- Pass `campaignState`, `currentNode.id`
- Position: e.g. top-left of card or dedicated panel above prose

## Phase 5: Verification Quest

### 5.1 cert-composable-sprite-v1

**File**: `scripts/seed-cyoa-certification-quests.ts` (or new `seed:cert:composable-sprite`)

- Add Twine story + CustomBar `cert-composable-sprite-v1`
- Steps: (1) Open /campaign?ref=bruised-banana, (2) Confirm avatar preview shows base, (3) Choose nation, confirm nation_body appears, (4) Choose playbook, confirm playbook_outfit appears, (5) Complete to sign-up, (6) Sign up, (7) Confirm full avatar in dashboard
- Narrative: preparing the party for the Bruised Banana Fundraiser

## File Structure

| Action | File |
|--------|------|
| Create | `src/lib/avatar-parts.ts` |
| Modify | `src/lib/avatar-utils.ts` |
| Modify | `src/components/Avatar.tsx` |
| Modify | `src/app/campaign/actions/campaign.ts` |
| Modify | `src/app/api/adventures/[slug]/[nodeId]/route.ts` |
| Create | `src/app/campaign/components/OnboardingAvatarPreview.tsx` |
| Modify | `src/app/campaign/components/CampaignReader.tsx` |
| Modify | `scripts/seed-cyoa-certification-quests.ts` |
| Create | `public/sprites/parts/` (directories) |

## Verification

- BB flow: avatar preview builds step-by-step (base → nation_body → playbook_outfit → accents)
- Sign up: full avatar in dashboard
- Missing assets: fallback to initials, no broken images
- `npm run seed:cert:cyoa` (or equivalent) seeds cert-composable-sprite-v1

## Reference

- Spec: [.specify/specs/jrpg-composable-sprite-avatar/spec.md](spec.md)
- Depends on: [avatar-from-cyoa-choices](../avatar-from-cyoa-choices/spec.md), [lore-cyoa-onboarding](../lore-cyoa-onboarding/spec.md)
