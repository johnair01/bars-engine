# Tasks: 2D Sprite Avatar from CYOA Choices

## Phase 1: Schema and Derivation

- [x] Add `avatarConfig String?` to Player in prisma/schema.prisma
- [x] Run `npm run db:sync`
- [x] Create `src/lib/avatar-utils.ts` with `deriveAvatarConfig(nationId?, playbookId?, campaignDomainPreference?)`
- [x] In `createCampaignPlayer`, after nation/playbook/domain update, derive avatarConfig and update player
- [x] In guided flow (`conclave.ts`), derive avatarConfig when nation/playbook set
- [x] In `saveMvpProfileSetup`, derive avatarConfig when nation/playbook set

## Phase 2: Avatar Component

- [x] Create `src/components/Avatar.tsx` with props `player`, `size?`
- [x] Render config-based placeholder (colored circle + initials) when avatarConfig exists
- [x] Fallback to name initials when no avatarConfig

## Phase 3: Display Surfaces

- [x] Add Avatar to dashboard header (logged-in page)
- [x] Add Avatar to wallet page (profile-like)
- [x] Add Avatar to quest cards (creator in Market)

## Phase 4: Verification Quest

- [x] Add `cert-avatar-from-cyoa-v1` to seed-cyoa-certification-quests.ts
- [x] Steps: play BB CYOA, sign up, confirm avatar in dashboard

## Verification

- [x] CYOA → sign up → avatarConfig stored, avatar visible
- [x] `npm run seed:cert:cyoa` seeds cert-avatar-from-cyoa-v1
