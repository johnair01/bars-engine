# Tasks: BAR Invitation Flow Kaizen

## Phase 1: Delete BAR + visibility

- [x] **1.1** Create `src/actions/bar-delete.ts` with `deleteBar(barId)`. Check player is creator or admin. Return `{ success: true } | { error: string }`.
- [x] **1.2** In deleteBar: Prisma handles Invite.invitationBarId, CampaignInvitation.barId via onDelete: SetNull. BarShare etc. cascade.
- [x] **1.3** Delete CustomBar. Revalidate `/hand`, `/bars`, `/bars/[id]`.
- [x] **1.4** Create `DeleteBarButton` client component — shows "Delete" for owner, confirm dialog, calls deleteBar, redirects.
- [x] **1.5** Add DeleteBarButton to BAR detail page (owner only).
- [x] **1.6** Verify Private Drafts exclude inviteId: null (already done).

## Phase 2: Invitations I've forged

- [x] **2.1** Hand: fetch invitation BARs — `creatorId = playerId`, `inviteId != null`, `status = 'active'`. Include invite: { token }.
- [x] **2.2** Create InvitationBarCard — show title, Copy invite URL, Copy claim URL. Link to BAR detail.
- [x] **2.3** Add "Invitations I've forged" section to Hand when non-empty.

## Verification

- [ ] **V1** Creator deletes own BAR → BAR gone, redirect.
- [ ] **V2** Non-owner cannot delete (no button or error).
- [ ] **V3** Invitation BARs not in Private Drafts.
- [ ] **V4** Invitations I've forged shows pending invite BARs (Phase 2).
- [ ] **V5** `npm run build` and `npm run check` pass.
