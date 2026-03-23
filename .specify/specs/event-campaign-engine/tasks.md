# Tasks: Event Campaign Engine + Event Artifact System v1 (GH)

## Phase 1: Library

- [x] **GH-1.1** `src/lib/event-kotter.ts` — `EventKotterContext` type, `deriveKotterContext()` from completed event count + grammar
- [x] **GH-1.2** `formatIcsDateTime()`, `buildIcsContent()` — iCal helpers

## Phase 2: Actions

- [x] **GH-2.1** `createEventCampaign(input)` — EventCampaign + QuestThread
- [x] **GH-2.2** `createEventArtifact(input)` — EventArtifact under campaign
- [x] **GH-2.3** `getEventCampaignWithArtifacts(campaignId)` — full campaign view
- [x] **GH-2.4** `syncEventParticipantRolesFromBarResponses(eventId, questId)` — GA/GB RACI sync
- [x] **GH-2.5** `getEventKotterContext(campaignId)` — Kotter stage derivation
- [x] **GH-2.6** `exportEventArtifactToIcs(eventId)` — iCal export

## Verification

- [x] `npx tsc --noEmit` passes on GH files (pre-existing unrelated error in compileQuestCore.ts)
- [x] `npx eslint` passes on new files
