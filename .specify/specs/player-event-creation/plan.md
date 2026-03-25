# Plan: Player / campaign-owner event creation

Implement per [`.specify/specs/player-event-creation/spec.md`](./spec.md).

## Phase 1 — Authorization layer

- Add helpers (e.g. in `campaign-invitation.ts` or a small `event-authorization.ts`): `canCreateEventOnCampaign(playerId, campaignId)`, `canCreateCampaignOnInstance(playerId, instanceId)` mirroring `canInviteToEventArtifact` / `canInviteToInstance` patterns.
- Harden `createEventCampaign` and `createEventArtifact` in [`src/actions/event-campaign-engine.ts`](../../../src/actions/event-campaign-engine.ts): reject if not authorized; optionally set `eventArtifact.instanceId` from campaign when `campaign.instanceId` is set.

## Phase 2 — Orchestration (optional but recommended)

- Add `createMainEventWithPreprodArtifacts` (or equivalent) using `$transaction` with main + child `EventArtifact` rows and shared `linkedCampaignId`.
- `revalidatePath('/event')` after success.

## Phase 3 — UI

- **Create event** entry point on [`src/app/event/page.tsx`](../../../src/app/event/page.tsx) (or `CreateEventModal` client component): visible when `canCreate…` for active instance.
- Form fields aligned with `CreateEventArtifactInput` + schedule/capacity; wire `EditEventScheduleButton`-style validation where needed.
- Optional: “Add standard crew slots” checkbox invoking bundle action.

## Phase 4 — Reproducibility

- Update one representative seed script to call shared helpers or document parity in a short runbook under `docs/runbooks/`.
- Check off tasks in [`tasks.md`](./tasks.md).

## File impact (expected)

| Area | Files |
|------|--------|
| Actions | `src/actions/event-campaign-engine.ts`, possibly `src/actions/campaign-invitation.ts` |
| UI | `src/app/event/page.tsx`, new `src/app/event/CreateEvent*.tsx` or `src/components/event/` |
| Tests | Unit tests for guards; optional action tests |
