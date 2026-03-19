# Plan: BAR Invitation Flow Kaizen

## Overview

Phase 1: Delete BAR + formalize invitation exclusion. Phase 2: Invitations I've forged section on Hand.

## Phases

### Phase 1: Delete BAR + visibility

1. **deleteBar** — Create `src/actions/bar-delete.ts` with `deleteBar(barId)`. Check creator or admin. Handle Invite.invitationBarId (set null), CampaignInvitation (if barId, consider cascade or block delete if invitation exists). Hard delete CustomBar.
2. **BAR detail Delete button** — Add Delete button for owner. Confirm modal or inline confirm. Call deleteBar, redirect to /bars or /hand.
3. **Private Drafts** — Already done: inviteId: null. Verify.

4. **Invite relations** — When deleting BAR with inviteId: Invite.invitationBarId should be set null (or Invite stays, BAR is gone — invitee can still use token). CampaignInvitation.barId: set null on delete.

### Phase 2: Invitations I've forged

- **Hand section** — Fetch BARs with inviteId, creatorId=player. Include Invite for token. Render "Invitations I've forged" with copy link, claim link.
- **Component** — InvitationBarCard or similar with Copy URL, Copy claim URL.

## File impacts

- `src/actions/bar-delete.ts` (new)
- `src/app/bars/[id]/page.tsx` — Delete button
- `src/components/bars/DeleteBarButton.tsx` (new, client)
- `src/app/hand/page.tsx` — Invitations I've forged section (Phase 2)
- `src/components/hand/InvitationBarCard.tsx` (new, Phase 2)

## Verification

- Creator can delete own BAR; redirects; BAR gone.
- Admin can delete any BAR.
- Non-owner cannot delete.
- Invitation BARs not in Private Drafts.
- Invitations I've forged shows pending invite BARs (Phase 2).
