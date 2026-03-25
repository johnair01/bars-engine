# Plan: Unified CYOA graph authoring & validation

## Phase 0 — Alignment (complete when this folder exists)

- Spec names four artifacts (invite JSON, `Passage` graph, IR, CMA) and the **CampaignReader** failure mode.
- Links **admin-cyoa-preview-draft-wizard** and **cyoa-modular-charge-authoring**.

## Phase 1 — Validation spine (backend first)

1. Add `src/lib/story-graph/` (name TBD) with:
   - types: `StoryGraphNode`, `StoryGraphEdge`, `StoryGraphValidationIssue`
   - `validateDirectedStoryGraph({ nodes, edges, startId })` — dangling target detection, optional orphan warnings
2. Adapters:
   - `passagesToStoryGraph(adventureId)` — Prisma load passages, parse `choices` JSON
   - `eventInviteStoryToGraph(story: EventInviteStory)` — for lint/tests
3. Integrate **`upsertCampaignPassage`**: before/after write, run validation; return structured errors to the modal.
4. Unit tests: mirror patterns in `validateIrStory` / `validateQuestGraph` tests.

## Phase 2 — Admin authoring UX

1. **Passage graph panel** on `admin/adventures/[id]` (or adventure detail): table of `nodeId`, in-degree, out-degree, broken link count.
2. **`CampaignPassageEditModal`**: replace free-text `targetId` with **combobox** of existing nodes + “+ New node…” that calls create passage flow with `linkFrom` (see admin-cyoa-preview spec).
3. Improve player error copy: optionally show node id in dev; keep user-safe message in prod.

## Phase 3 — Invite content

1. Add `src/lib/event-invite-story/templates/` or generator function producing JSON that passes `parseEventInviteStory`.
2. Seed or admin “reset to template” for `event_invite` BARs (optional).
3. Cross-check **endingCtas** with EIP spec (Partiful + initiation).

## Phase 4 — Modular / player paths

1. Document **single import** path: CMA → IR already exists; ensure new player UI uses **same** `validateDirectedStoryGraph` after adapter from `CmaStory`.
2. If player-authored graphs persist as IR or passages, reuse **Phase 2** components in a role-gated surface (future spec).

## File impacts (expected)

| Area | Files |
|------|--------|
| Validation | `src/lib/story-graph/*`, `src/actions/campaign-passage.ts` |
| Admin UI | `CampaignPassageEditModal.tsx`, `admin/adventures/[id]/*`, `createPassage` actions |
| Invite | `src/lib/event-invite-story/*`, seeds |
| Tests | `src/lib/story-graph/__tests__/*` |

## Dependencies

- Prisma `Passage`, `Adventure` models (existing).
- No schema migration required for Phase 1–2 unless we add graph metadata cache (optional).
