# Plan: Awareness content `EventCampaign`

Implement per [.specify/specs/awareness-content-event-campaign/spec.md](./spec.md).

## File impacts (v1)

| Area | Files |
|------|--------|
| Types | [`src/lib/event-campaign-types.ts`](../../src/lib/event-campaign-types.ts) |
| Actions | [`src/actions/event-campaign-engine.ts`](../../src/actions/event-campaign-engine.ts) — create, list, artifact guard |
| `/event` | [`src/app/event/page.tsx`](../../src/app/event/page.tsx), [`CreateAwarenessRunModal.tsx`](../../src/app/event/CreateAwarenessRunModal.tsx), [`CreateAwarenessRunButton.tsx`](../../src/app/event/CreateAwarenessRunButton.tsx) |
| Admin | [`src/components/admin/AddCampaignKernelButton.tsx`](../../src/components/admin/AddCampaignKernelButton.tsx) |

## Phases

1. **Types + engine** — campaign type constants; create + list + artifact block.
2. **Event UI** — filter gatherings; awareness section; modal.
3. **Admin parity** — kernel button kind selector.

Phase 2 (prompt schema, CHS binding, player thread link) → tasks unchecked in [tasks.md](./tasks.md); ontology → [campaign-subcampaigns](../campaign-subcampaigns/spec.md) (**CSC** backlog).
