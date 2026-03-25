# Tasks: Unified CYOA graph authoring & validation

## Phase 1 — Validation spine

- [x] **UG-1.1** — Create `src/lib/story-graph/validateDirectedGraph.ts` + types; tests for dangling edge, missing start, orphan nodes (warning).
- [x] **UG-1.2** — Add `adventurePassagesGraph.ts` (parse `choices` JSON + `buildAdventureGraphModel`).
- [x] **UG-1.3** — Call validator from `upsertCampaignPassage` (block on errors).
- [x] **UG-1.4** — Wire `CampaignPassageEditModal` to display validation errors; target `datalist` + `listCampaignPassageNodeIds`.

## Phase 2 — Admin graph UX

- [ ] **UG-2.1** — Adventure detail: **Node map** table (nodeId, #choices, broken targets).
- [x] **UG-2.2** — Choice editor: **target suggestions** (`datalist`) from `listCampaignPassageNodeIds` (+ `signup` / `Game_Login`).
- [ ] **UG-2.3** — Implement or finish **`linkFrom`** on `createPassage` per [admin-cyoa-preview-draft-wizard](../admin-cyoa-preview-draft-wizard/spec.md).
- [ ] **UG-2.4** — Optional: `?preview=1` on adventures API for DRAFT play (same spec).

## Phase 3 — Invite content

- [ ] **UG-3.1** — Author `eventInviteGuestJourneyTemplate` (JSON) covering: signup path, pre-prod, learn app; validate with `parseEventInviteStory`.
- [ ] **UG-3.2** — Document in `docs/events/` how to apply template to a BAR (or script `apply-invite-template.ts`).
- [ ] **UG-3.3** — Optional: AI assist prompt constrained to schema (reuse narrative-quality skill patterns).

## Phase 4 — Modular merge

- [ ] **UG-4.1** — Doc only: map `CmaStory` → `validateQuestGraph` ↔ shared graph validator (table in spec.md).
- [ ] **UG-4.2** — If adding player graph save: run shared validator before persist; reuse admin graph table component where possible.

## Verification

- [ ] **UG-V.1** — `npm run check` after each phase.
- [ ] **UG-V.2** — Manual: add choice with bogus `targetId` → author-time error; fix → `CampaignReader` navigates without “Could not load this step.”
