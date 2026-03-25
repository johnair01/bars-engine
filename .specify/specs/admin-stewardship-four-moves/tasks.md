# Tasks: Admin stewardship — four moves + campaign/event governance

## Phase A — IA & wayfinding

- [x] **A1** Write **four-move → tasks → routes** mapping (in spec appendix or `docs/runbooks/ADMIN_STEWARDSHIP.md`)
- [x] **A2** Write **Six Game Master faces × example admin tasks** table
- [x] **A3** Update **Admin Control Center** (`src/app/admin/page.tsx`) with four-move wayfinding section + links to Instances / campaign-event entry / config
- [x] **A4** Add cross-link from relevant runbooks to this spec

## Phase B — Edit events in-app

- [x] **B1** Define `canEditEventArtifact` (or extend existing helpers) for host vs steward vs admin
- [x] **B2** Implement **`updateEventArtifact`** (or equivalent) server action with validation + `revalidatePath`
- [x] **B3** Add **admin UI** to find and edit an event (minimum viable route)
- [x] **B4** Align **`/event`** edit affordances with spec if gaps remain (schedule vs full fields)

## Phase C — Host reassignment

- [x] **C1** Server action to update **`EventCampaign.hostActorIds`** (**global admin** only, scoped to instance)
- [x] **C2** Minimal UI + confirmation copy
- [x] **C3** Document privacy / sunset expectations for admin override

## Verification

- [x] **V1** `npm run build` && `npm run check` after each phase merge
