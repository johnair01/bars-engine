# Plan: Event invite inline editing

## Order

1. Server action `updateEventInviteBarContent` in [`src/app/hand/event-invite-bar-actions.ts`](../../../src/app/hand/event-invite-bar-actions.ts) (alongside link updater).
2. Client [`src/components/event-invite/EventInviteBarContentEditor.tsx`](../../../src/components/event-invite/EventInviteBarContentEditor.tsx) — title, description, story JSON textarea; validate feedback; `router.refresh()`.
3. [`src/app/invite/event/[barId]/page.tsx`](../../../src/app/invite/event/[barId]/page.tsx) — `getCurrentPlayer` + `playerCanEditEventInviteBar`; render editor when allowed.
4. [`src/lib/vault-event-invite-bars.ts`](../../../src/lib/vault-event-invite-bars.ts) — select `description`, `storyContent`; extend row type.
5. [`src/components/hand/VaultCampaignInviteBars.tsx`](../../../src/components/hand/VaultCampaignInviteBars.tsx) — embed content editor per row.

## Verification

- `npm run check`, `npm run build`
