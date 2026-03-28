# Tasks: Unified CYOA graph authoring & validation

## Phase 1 — Validation spine

- [x] **UG-1.1** — Create `src/lib/story-graph/validateDirectedGraph.ts` + types; tests for dangling edge, missing start, orphan nodes (warning).
- [x] **UG-1.2** — Add `adventurePassagesGraph.ts` (parse `choices` JSON + `buildAdventureGraphModel`).
- [x] **UG-1.3** — Call validator from `upsertCampaignPassage` (block on errors).
- [x] **UG-1.4** — Wire `CampaignPassageEditModal` to display validation errors; target `datalist` + `listCampaignPassageNodeIds`.

## Phase 2 — Admin graph UX

- [x] **UG-2.1** — Adventure detail: **Node map** table (nodeId, #choices, broken targets).
- [x] **UG-2.2** — Choice editor: **target suggestions** (`datalist`) from `listCampaignPassageNodeIds` (+ `signup` / `Game_Login`).
- [x] **UG-2.3** — Implement or finish **`linkFrom`** on `createPassage` per [admin-cyoa-preview-draft-wizard](../admin-cyoa-preview-draft-wizard/spec.md).
- [x] **UG-2.4** — `?preview=1` on adventures API for admins + `CampaignReader` passes `preview=1` when `isAdmin` (DRAFT play).

## Phase 3 — Invite content

- [x] **UG-3.1** — `event-invite-guest-journey.template.json` + `templates/guest-journey.ts`; `parseEventInviteStory` + `guest-journey-template.test.ts`.
- [x] **UG-3.2** — `docs/events/EVENT_INVITE_GUEST_JOURNEY_TEMPLATE.md` + `scripts/apply-invite-template.ts`.
- [ ] **UG-3.3** — **Deferred** → [BACKLOG **UGAF** (1.50.1)](../../../.specify/backlog/BACKLOG.md): optional AI assist for `event_invite` JSON (schema-constrained; narrative-quality patterns).

## Phase 4 — Modular merge

- [x] **UG-4.1** — Spec § **Modular graph validation alignment** — `CmaStory` / `validateQuestGraph` / `validateIrStory` vs `validateDirectedGraph`.
- [ ] **UG-4.2** — **Deferred** → [BACKLOG **UGAF** (1.50.1)](../../../.specify/backlog/BACKLOG.md): on player/steward graph → `Passage` persist, run `validateFullAdventurePassagesGraph` + reuse admin graph table where possible.

## Verification

- [x] **UG-V.1** — `npm run check` after each phase (last run: green).
- [ ] **UG-V.2** — Manual: add choice with bogus `targetId` → author-time error; fix → `CampaignReader` navigates without “Could not load this step.”
