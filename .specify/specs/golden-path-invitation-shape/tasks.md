# Tasks: Golden Path Invitation Shape

## Phase 1: Schema

- [x] Add `instanceId String?`, `starterQuestId String?`, `invitationBarId String?` to Invite in prisma/schema.prisma
- [x] Add optional relations: instance, starterQuest, invitationBar (CustomBar)
- [x] Run `npm run db:sync`

## Phase 2: Server Action

- [x] Create or extend `acceptGoldenPathInvitation(inviteId, playerId?)` server action
- [x] Ensure InstanceMembership created when instanceId present
- [x] Return `{ success: true, redirectTo: string }` or `{ error: string }`

## Phase 3: Verification

- [ ] Run `npm run build` and `npm run check`
