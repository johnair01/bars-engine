# Spec: BAR Invitation Flow Kaizen

## Purpose

Improve the BAR invitation flow so creators can manage invitation BARs and delete unwanted BARs. Invitation BARs (created by `strengthenResidency` or Forge Invitation form) are delivery vehicles for invites, not editable drafts. They should not clutter Private Drafts, and creators should be able to delete BARs they own.

**Source**: [BAR_INVITATION_FLOW.md](../bar-generation-flow/BAR_INVITATION_FLOW.md)

## Problem Statement

- **Invitation BARs in drafts**: BARs with `inviteId` appeared in Private Drafts on Hand, confusing creators who treat them as editable content.
- **No delete**: Creators cannot delete BARs they don't want (e.g. orphan invitation BARs from testing).
- **Traceability**: Hard to audit which BARs were created by completion effects vs manual.

## User Stories

### P1: Invitation BARs excluded from Private Drafts

**As a creator**, I want invitation BARs (those I forged to share) to appear in a dedicated section, not mixed with my editable drafts.

**Acceptance**: Private Drafts exclude BARs with `inviteId`. Invitation BARs appear in "Invitations I've forged" (or similar) with copy/share actions.

### P2: Delete BAR (creator only)

**As a creator**, I want to delete BARs I own when I no longer need them.

**Acceptance**: BAR detail page shows "Delete" for owner. Server action `deleteBar(barId)` deletes (or soft-deletes) the BAR. Ownership check; revalidate paths.

### P3: Invitations I've forged section

**As a creator**, I want to see my pending invitation BARs (inviteId set, status active) with copy/share links.

**Acceptance**: Hand shows "Invitations I've forged" section (when non-empty) with BARs linked to active invites. Copy invite URL, copy claim URL.

## Functional Requirements

### Phase 1: Visibility + Delete

- **FR1**: Private Drafts exclude BARs with `inviteId` (already implemented).
- **FR2**: `deleteBar(barId)` — Server Action. Player must be creator or admin. Hard delete (or soft-delete via status). Revalidate `/hand`, `/bars`, `/bars/[id]`.
- **FR3**: BAR detail page: show "Delete" button for owner. Confirm before delete.
- **FR4**: Delete BAR: cascade or handle related records (Invite.invitationBarId, CampaignInvitation.barId, BarShare). Set null or delete as appropriate.

### Phase 2: Invitations I've forged

- **FR5**: Hand: fetch BARs where `creatorId = player`, `inviteId != null`, `status = 'active'`. Join with Invite for token.
- **FR6**: "Invitations I've forged" section: list of invite BARs with Copy invite URL, Copy claim URL. Link to BAR detail.

## Non-Functional Requirements

- No breaking changes to existing Forge Invitation or completion-effect flows.
- Delete is destructive; confirm before executing.

## Dependencies

- CustomBar, Invite, CampaignInvitation, BarShare schema
- getBarDetail, bars actions

## References

- `src/actions/quest-engine.ts` — _forgeInvitationBarInTx
- `src/actions/forge-invitation-bar.ts` — forgeInvitationBar
- `src/app/hand/page.tsx` — Hand, Private Drafts
- `src/app/bars/[id]/page.tsx` — BAR detail
