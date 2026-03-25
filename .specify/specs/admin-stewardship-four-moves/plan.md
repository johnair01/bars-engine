# Plan: Admin stewardship — four moves + campaign/event governance

Implement per [`.specify/specs/admin-stewardship-four-moves/spec.md`](./spec.md).

## Phase A — Information architecture & docs

1. **Define the four-move map** (table): each move → **intent** → **example tasks** → **primary `/admin` routes** (existing pages slotted; stubs noted).
2. **Admin dashboard** (`src/app/admin/page.tsx`): add a **wayfinding** section (four quadrants or rows) linking to **Instances**, **campaign/event** stewardship entry, **config**, etc.—minimal layout change, maximum clarity.
3. **Appendix:** add `docs/runbooks/ADMIN_STEWARDSHIP.md` (or under `.specify/specs/.../`) with **Six faces × tasks** matrix and links to runbooks.

## Phase B — Edit event (in-app)

1. **Server action(s):** `updateEventArtifact` (or extend existing schedule update) for **title, description, schedule, capacity, timezone** as required; enforce **canEditEventArtifact**-style rules (reuse patterns from `campaign-invitation.ts` + admin checks).
2. **UI:** **Admin path**: `/admin/instances` → instance detail or new **`/admin/campaign-events`** style list (pick smallest route that fits existing patterns); **optional** parity on `/event` for hosts (may already have `EditEventScheduleButton`—extend if needed).
3. **Revalidation** of `/event` and admin views after save.

## Phase C — Host / owner reassignment

1. **Server action:** update `EventCampaign.hostActorIds` (parse/stringify JSON) with **admin or steward** gate; confirm **instance/campaign** scope.
2. **UI:** small form on campaign detail or stewardship page; **confirmation** string for destructive-ish changes.

## File impact (expected)

| Area | Files |
|------|--------|
| Admin shell | `src/app/admin/page.tsx`, possibly `src/components/admin/*` |
| Actions | `src/actions/campaign-invitation.ts`, `src/actions/event-campaign-engine.ts` or new `event-stewardship.ts` |
| UI | New or extended route under `src/app/admin/`, optional `src/app/event/*` |
| Docs | `docs/runbooks/ADMIN_STEWARDSHIP.md`, this spec kit |

## Ordering

Execute **A → B → C** unless security work in B blocks; ship A quickly for **onboarding wins**.
