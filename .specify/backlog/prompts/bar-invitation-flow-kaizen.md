# Backlog Prompt: BAR Invitation Flow Kaizen

**Spec**: [.specify/specs/bar-invitation-flow-kaizen/spec.md](../specs/bar-invitation-flow-kaizen/spec.md)

## Problem

Invitation BARs (from strengthenResidency or Forge Invitation) appeared in Private Drafts, confusing creators. No way to delete unwanted BARs. Need dedicated "Invitations I've forged" section.

## Scope

1. **Delete BAR** — Creator or admin can delete BARs. Confirm before delete.
2. **Invitation visibility** — Exclude inviteId BARs from Private Drafts; show in "Invitations I've forged" with copy URLs.
3. **Traceability** — See BAR_INVITATION_FLOW.md for generation flow.

## Implementation

Implement per `.specify/specs/bar-invitation-flow-kaizen/` — spec.md, plan.md, tasks.md.

## References

- `src/actions/quest-engine.ts` — _forgeInvitationBarInTx
- `src/actions/forge-invitation-bar.ts`
- `src/app/hand/page.tsx`
- [BAR_INVITATION_FLOW.md](../specs/bar-generation-flow/BAR_INVITATION_FLOW.md)
