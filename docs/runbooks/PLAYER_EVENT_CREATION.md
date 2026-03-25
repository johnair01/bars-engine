# Player-facing event creation (`/event`)

Authorized hosts and stewards can create **`EventCampaign`** and **`EventArtifact`** rows from the campaign page so listings, invites, and `.ics` stay aligned with the database—same structures as seeds.

## Who can do what

- **Add gathering** (create `EventArtifact`): same gate as **Invite to event** — instance admin / owner / steward, or a player listed in `EventCampaign.hostActorIds` for a campaign linked to this instance (`canInviteToAnyEventOnInstance` / `canCreateEventOnCampaign`).
- **Create production campaign** (create `EventCampaign`): stewards and admins only (`canCreateCampaignOnInstance` — same as instance invite permissions for non-host actions).

## Code paths

- UI: [`src/app/event/CreateEventButton.tsx`](../../src/app/event/CreateEventButton.tsx), [`src/app/event/CreateEventModal.tsx`](../../src/app/event/CreateEventModal.tsx)
- Actions: [`src/actions/event-campaign-engine.ts`](../../src/actions/event-campaign-engine.ts) — `createEventCampaign`, `createEventArtifact`, `getEventCampaignsForInstance`
- Authorization: [`src/actions/campaign-invitation.ts`](../../src/actions/campaign-invitation.ts) — `canCreateCampaignOnInstance`, `canCreateEventOnCampaign`

## Seeds

Prefer calling the same server actions from scripts where possible, or keep seed data equivalent (campaign `instanceId`, artifact `instanceId`, hosts JSON) so `/event` and invites behave the same as UI-created rows.

Spec: [`.specify/specs/player-event-creation/spec.md`](../../.specify/specs/player-event-creation/spec.md).

## Related

- [ADMIN_STEWARDSHIP.md](./ADMIN_STEWARDSHIP.md) — four moves, six faces, **edit** events and reassign hosts (`/admin/campaign-events`).
