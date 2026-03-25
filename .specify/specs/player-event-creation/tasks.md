# Tasks: Player / campaign-owner event creation

- [x] **T1** Define `canCreateEventOnCampaign` / `canCreateCampaignOnInstance` (or equivalent) using existing invite/steward rules
- [x] **T2** Harden `createEventCampaign` with auth + optional `instanceId` validation
- [x] **T3** Harden `createEventArtifact` with auth + set `instanceId` on artifact when campaign has `instanceId`
- [ ] **T4** (Optional) Add `createMainEventWithPreprodArtifacts` transaction + tests
- [x] **T5** Add player-facing create UI on `/event` gated by T1/T2/T3
- [x] **T6** `revalidatePath('/event')` on successful create
- [x] **T7** Align one seed or runbook with the same contract
- [x] **T8** `npm run build` && `npm run check`
