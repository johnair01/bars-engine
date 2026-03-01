# Tasks: JRPG Composable Sprite Avatar + Build-a-Bear Onboarding

## Phase 1: Avatar Parts Module + Config Extension

- [ ] Create `src/lib/avatar-parts.ts` with PartLayer, PartSpec, getAvatarPartSpecs, getUnlockedLayersForNode, getAvatarPartSpecsForProgress
- [ ] Extend AvatarConfig in `src/lib/avatar-utils.ts` with genderKey
- [ ] Add deriveGenderFromPronouns and slugifyName to avatar-utils
- [ ] Update createCampaignPlayer to fetch Nation/Playbook and derive avatarConfig with name-based nationKey, playbookKey
- [ ] Update conclave.ts / saveMvpProfileSetup to use name-based keys when setting avatarConfig

## Phase 2: BB API — nationKey and playbookKey Macros

- [ ] In adventures API route: BB_SetNation_* node text includes <<set $nationKey = "slug">> (look up Nation, slugify name)
- [ ] In adventures API route: BB_SetPlaybook_* node text includes <<set $playbookKey = "slug">> (look up Playbook, slugify name)

## Phase 3: Avatar Component — Layered Rendering

- [ ] Update Avatar.tsx to call getAvatarPartSpecs and render stacked img layers
- [ ] Add onError handler per layer; fallback to initials when all fail
- [ ] Create public/sprites/parts/ directory structure (base/, nation_body/, etc.)
- [ ] Add placeholder base/default.png (optional; fallback works without)

## Phase 4: OnboardingAvatarPreview + CampaignReader

- [ ] Create OnboardingAvatarPreview.tsx with campaignState, currentNodeId props
- [ ] Implement getUnlockedLayersForNode logic and getAvatarPartSpecsForProgress
- [ ] Render layered preview with fallback
- [ ] Add OnboardingAvatarPreview to CampaignReader when campaignRef === 'bruised-banana'
- [ ] Pass campaignState and currentNode.id to preview

## Phase 5: Verification Quest

- [ ] Add cert-composable-sprite-v1 to seed-cyoa-certification-quests.ts (or create seed:cert:composable-sprite)
- [ ] Steps: BB flow, confirm avatar builds step-by-step, sign up, confirm full avatar in dashboard

## Verification

- [ ] BB flow: avatar preview shows base → nation_body → playbook_outfit as choices are made
- [ ] Sign up: full avatar visible in dashboard header
- [ ] Missing assets: initials fallback, no broken images
- [ ] npm run seed:cert:cyoa seeds cert-composable-sprite-v1
