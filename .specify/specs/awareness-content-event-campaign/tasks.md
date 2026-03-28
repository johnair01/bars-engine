# Tasks: Awareness content `EventCampaign`

Spec: [.specify/specs/awareness-content-event-campaign/spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## Phase 1 — v1 (calendar separation)

- [x] **ACEC-1** — `event-campaign-types.ts` + `createEventCampaign` `campaignType` + thread title prefix.
- [x] **ACEC-2** — `getEventCampaignsForInstance` returns `campaignType` + `productionThreadId`.
- [x] **ACEC-3** — `createEventArtifact` blocks `awareness_content_run`.
- [x] **ACEC-4** — `/event` calendar filter + awareness section + `CreateAwarenessRunModal` / button.
- [x] **ACEC-5** — `AddCampaignKernelButton` campaign kind selector.

## Phase 2 — prompts + CHS + player UX

- [ ] **ACEC-6** — Passage/BAR metadata for “daily LLM prompt pack”; copy/export affordance; BBM framework lint (docs or validator).
- [ ] **ACEC-7** — Link awareness run to hub spoke adventure(s) when CHS metadata exists.
- [ ] **ACEC-8** — Non-admin entry to production thread (player-safe route or Hand integration).

## Verification

- [x] `npm run check` after changes.
- [ ] Manual quest in spec § Verification Quest (record in PR when run).

## Related backlog

- **CSC** — [campaign-subcampaigns](../campaign-subcampaigns/spec.md) (Path C — subcampaign ontology under `campaignRef`).
