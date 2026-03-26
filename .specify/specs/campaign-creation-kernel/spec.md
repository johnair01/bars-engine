# Spec: Campaign creation kernel (admin)

## Purpose

Provide a **single, explicit path** to create an **`EventCampaign`** tied to an **`Instance`**, with a linked **production `QuestThread`**, so operators can bootstrap productions without seeds. This is the **kernel** behind **Add campaign** on `/admin/campaign-events`.

**Depends on:** [event-campaign-engine](../event-campaign-engine/spec.md) — `createEventCampaign`; auth via `canCreateCampaignOnInstance` (admin / owner / steward).

## Behavior (v1)

1. Operator selects **instance**, clicks **Add campaign**, submits **campaign context**, **topic**, **primary domain**, **production grammar**.
2. Server creates `EventCampaign` with `instanceId`, `hostActorIds: [creator]`, `status: proposed`, and `QuestThread` linked via `eventCampaignId`.
3. **`/event`** and **`/admin/campaign-events`** revalidate so new campaigns appear in pickers and stewardship flows.

## Non-goals (v1)

- Assigning arbitrary co-hosts at create time (use host ids on event/campaign edit or `assign:campaign-hosts` script).
- Player-facing `/event` “create campaign” for non-stewards (remains steward/admin; see player-event-creation for host flows).

## References

- [`src/components/admin/AddCampaignKernelButton.tsx`](../../../src/components/admin/AddCampaignKernelButton.tsx)
- [`src/actions/event-campaign-engine.ts`](../../../src/actions/event-campaign-engine.ts)
