# Spec: Event Campaign Engine + Event Artifact System v1 (GH)

## Purpose

A campaign is a **production organism** — it has a lifecycle, a production grammar (Kotter or Epiphany Bridge), a linked quest thread for stewardship, and it spawns discrete event artifacts. GH wires this together with the GA/GB RACI layer and adds calendar export.

## Depends on

- **GA** — `BarResponse.intent`, `BarResponse.raciRole`, `getBarRoles()`
- **GB** — `getQuestRoleResolution()`, `takeQuest()`
- **GC** — `getEligibleActorsForQuest()` (for future invite recommendations)

## Schema: none (models already exist)

`EventCampaign`, `EventArtifact`, `EventParticipant`, `EventInvite` are all present.
`QuestThread.eventCampaignId` links a production thread to a campaign.

## Domain vs Topic

- **Domain** (`primaryDomain`) = allyship domain: `GATHERING_RESOURCES | SKILLFUL_ORGANIZING | RAISE_AWARENESS | DIRECT_ACTION`. Structural.
- **Topic** = narrative subject (e.g. "Emotional First Aid"). Thematic. Can vary across artifacts in the same campaign.

## Kotter context derivation

Given a campaign's `productionGrammar = 'kotter'`, derive the current Kotter stage from:
1. `EventArtifact.status` histogram: each completed event contributes +1 toward stage advancement
2. Stage = `min(8, completedCount + 1)` — one stage per completed event artifact
3. Return stage metadata from `KOTTER_STAGES[stage]`

For `productionGrammar = 'epiphany_bridge'`, return a fixed context noting the arc (v0 placeholder).

## RACI sync

`syncEventParticipantRolesFromBarResponses(eventId, questId)`:
- Reads all `BarResponse` records for `questId` with non-null `raciRole`
- Upserts `EventParticipant` entries: links each responder's `raciRole` to the event
- Sets `participantState = 'interested'` if no prior state exists

## Calendar export (iCal)

`exportEventArtifactToIcs(eventId)` — generates a valid iCal string (no external deps):
- `VEVENT` with `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `LOCATION` (from `locationType`)
- Returns string for download as `.ics`

## API contract

### `createEventCampaign(input)`
- Creates `EventCampaign` + linked `QuestThread` (the production thread)
- Returns `{ campaignId, threadId }`

### `createEventArtifact(input)`
- Creates `EventArtifact` under a campaign
- Returns `{ artifactId }`

### `getEventCampaignWithArtifacts(campaignId)`
- Full campaign view: metadata + all artifacts + participant counts

### `syncEventParticipantRolesFromBarResponses(eventId, questId)`
- GA/GB integration: RACI from BarResponse → EventParticipant.raciRole

### `getEventKotterContext(campaignId)`
- `{ stage, stageName, stageEmoji, completedEventCount, totalEventCount, productionGrammar }`

### `exportEventArtifactToIcs(eventId)`
- Returns `{ icsContent: string; filename: string }`

## Non-goals (v0)
- UI components
- Recurring event RRULE parsing
- Automated participant notifications
