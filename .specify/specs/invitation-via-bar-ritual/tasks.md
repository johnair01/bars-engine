# Tasks: Invitation-via-BAR Ritual

## Phase 1: Invite landing + gate

- [x] **1.1** Create `src/app/invite/[token]/page.tsx`:
  - Fetch invite by token
  - Invalid/used: show error UI
  - Valid: render sign-up form (nation, playbook, identity) with createCharacter, token hidden
  - Fetch nations and archetypes for selects

- [x] **1.2** Add `isGameAccountReady(player)` to `src/lib/auth.ts` (or auth-utils)

- [x] **1.3** Gate `src/app/world/[instanceSlug]/[roomSlug]/page.tsx`: redirect when !isGameAccountReady

- [x] **1.4** Gate `src/app/quest/page.tsx`: unauthenticated → `/conclave/guided`; authenticated but !gameAccountReady → `/conclave/guided`

- [x] **1.5** Gate hand routes: identify layout/page and add isGameAccountReady check

- [x] **1.6** Update quest redirect from `/invite/ANTIGRAVITY` to `/conclave/guided` if desired

## Phase 2: BAR linkage + claim

- [x] **2.1** Add `inviteId String?` to CustomBar in `prisma/schema.prisma`; add Invite relation
  - `invite Invite? @relation(fields: [inviteId], references: [id])`
  - Invite model: `invitationBars CustomBar[]` (optional back-relation)

- [x] **2.2** Run `npm run db:sync`

- [x] **2.3** Create `src/app/invite/claim/[barId]/page.tsx`:
  - Fetch BAR; if !bar or !bar.inviteId → error
  - Fetch invite; if invalid/used → error
  - Redirect to `/invite/[invite.token]`

- [ ] **2.4** Document admin flow: create invite + optional BAR with inviteId (script or manual)

## Verification

- [ ] `npm run build` and `npm run check` pass
- [ ] /invite/{token} works with valid token
- [ ] Gate blocks /world, /hand, /quest when !gameAccountReady
- [ ] /invite/claim/{barId} redirects to /invite/{token}
