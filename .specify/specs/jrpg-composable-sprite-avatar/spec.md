# Spec: JRPG Composable Sprite Avatar + Build-a-Bear Onboarding

## Purpose

Replace the current avatar (colored circle + initials) with JRPG-style 2D sprites built from composable parts keyed by nation and archetype. As players move through the Bruised Banana campaign flow, their sprite assembles piece by piece — build-a-bear style — so character creation feels tangible and rewarding.

**Extends**: [2D Sprite Avatar from CYOA Choices](../avatar-from-cyoa-choices/spec.md) (AD)

## Rationale

- **Composable parts**: Nation and playbook map to layered sprite parts (body, outfit, accent); new parts can be added without changing the model.
- **Gender-aware base**: Generic body (male/female/neutral) supports future pronoun-driven customization.
- **Build-a-bear onboarding**: Progressive reveal during CYOA — base at intro, nation_body when nation chosen, playbook_outfit when archetype chosen, etc. — creates anticipation and payoff.
- **Game language**: WHO (nation, archetype) + WHERE (domain) map to visual representation.

## Conceptual Model (Game Language)

| Dimension | Maps to |
|-----------|---------|
| **WHO** (Nation) | nation_body, nation_accent layers |
| **WHO** (Archetype/Playbook) | playbook_outfit, playbook_accent layers |
| **WHERE** (Domain) | nation_accent unlock timing |
| **Identity** | Base (gender) + stacked modifications |

## User Stories

### P1: Composable sprite rendering

**As a player**, I want my avatar to render as layered sprite parts (base + nation + playbook), so my character reflects my CYOA choices visually.

**Acceptance**: Avatar component renders stacked layers from `getAvatarPartSpecs(config)`; missing assets fall back to initials; no broken images.

### P2: Gender-aware base

**As a player**, I want my avatar base to reflect my pronouns when set, so my representation feels accurate.

**Acceptance**: `avatarConfig.genderKey` derived from `player.pronouns` (he/him → male; she/her → female; they/them or unset → neutral/default).

### P3: Build-a-bear onboarding

**As a player**, I want to see my character take shape as I make choices in the campaign flow, so the onboarding feels like building my identity.

**Acceptance**: CampaignReader shows OnboardingAvatarPreview; layers unlock progressively: base (steps 1–3), nation_body (step 4), playbook_outfit (step 5), nation_accent (step 6), playbook_accent (steps 7–11).

### P4: Stable keys for parts

**As a player**, I want my avatar to use consistent part paths regardless of database IDs, so assets can be added and cached reliably.

**Acceptance**: `avatarConfig` stores `nationKey` and `playbookKey` (name-based slugs: argyra, bold-heart); BB API sets these via macros when nation/playbook chosen.

### P5: Verification quest

**As a tester**, I want a certification quest that verifies composable sprite display and build-a-bear flow, so I can validate the feature and earn vibeulons. Narrative: preparing the party for the Bruised Banana Fundraiser.

**Acceptance**: `cert-composable-sprite-v1` walks through BB flow, confirms avatar preview builds step-by-step, signs up, confirms full avatar in dashboard.

## Functional Requirements

- **FR1**: AvatarConfig MUST extend with `genderKey?: 'male' | 'female' | 'neutral' | 'default'`. Derive from `player.pronouns` when available.
- **FR2**: `avatarConfig` MUST use name-based slugs (`nationKey`, `playbookKey`) — not CUID-derived keys. Resolve Nation/Playbook by id to get name, then slugify.
- **FR3**: Create `src/lib/avatar-parts.ts` with `PartLayer`, `PartSpec`, `getAvatarPartSpecs(config)`, `getUnlockedLayersForNode(nodeId, campaignState)`, `getAvatarPartSpecsForProgress(config, unlockedLayers)`.
- **FR4**: Avatar component MUST render layered `<img>` elements from part specs; `onError` hides layer; if all fail, show initials fallback.
- **FR5**: BB API (`BB_SetNation_*`, `BB_SetPlaybook_*`) MUST set `$nationKey` and `$playbookKey` via macros (look up Nation/Playbook name, slugify).
- **FR6**: Create `OnboardingAvatarPreview` component; render in CampaignReader when `campaignRef === 'bruised-banana'`; pass `campaignState` and `currentNode.id`.
- **FR7**: Verification quest `cert-composable-sprite-v1` MUST be seeded (e.g. via `npm run seed:cert:cyoa` or dedicated script).

## Part Layer Model

| Layer | Keyed by | Unlock at |
|-------|----------|-----------|
| base | genderKey | Steps 1–3 |
| nation_body | nationKey | Step 4 (nation chosen) |
| playbook_outfit | playbookKey | Step 5 (playbook chosen) |
| nation_accent | nationKey | Step 6 (domain chosen) |
| playbook_accent | playbookKey | Steps 7–11 (moves) |

Optional (out of scope v1): hair, accessory.

## Asset Directory Structure

```
public/sprites/parts/
  base/       default.png, male.png, female.png, neutral.png
  nation_body/  argyra.png, pyrakanth.png, ...
  nation_accent/
  playbook_outfit/
  playbook_accent/
```

Progressive enhancement: missing layers are skipped; fallback to initials when no assets load.

## Non-functional Requirements

- Fallback MUST always work (no broken images).
- Name-based slugs MUST be stable across deployments (use Nation.name, Playbook.name).
- OnboardingAvatarPreview MUST not block campaign flow when assets are missing.

## Out of Scope (v1)

- Custom sprite assets (use placeholders or LPC-derived assets separately)
- Animated sprite sheets (idle, walk)
- Avatar editing UI (change gender/parts)
- Domain affecting part selection (domain only affects unlock timing)
- Server-side pre-compositing

## Reference

- Cursor plan: JRPG Composable Sprite Avatar (build-a-bear onboarding)
- Avatar (current): [src/components/Avatar.tsx](../../src/components/Avatar.tsx)
- Avatar utils: [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts)
- Campaign API: [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- CampaignReader: [src/app/campaign/components/CampaignReader.tsx](../../src/app/campaign/components/CampaignReader.tsx)
- Related: [avatar-from-cyoa-choices](../avatar-from-cyoa-choices/spec.md), [lore-cyoa-onboarding](../lore-cyoa-onboarding/spec.md)
