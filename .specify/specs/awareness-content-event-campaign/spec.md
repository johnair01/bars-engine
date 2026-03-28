# Spec: Awareness content `EventCampaign` type

**Status:** Spec kit — v1 shipped in app (`awareness_content_run` + `/event` separation).  
**Relates to:** [events-bar-framework](../events-bar-framework/spec.md), [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md), [bb-residency-marketing-metabolism](../bb-residency-marketing-metabolism/spec.md) (message framework), [campaign-subcampaigns](../campaign-subcampaigns/spec.md) (Phase 2 ontology — **backlog**).

## Purpose

Give stewards a **first-class `EventCampaign` subtype** for **raise-awareness / social content sprints** that **reuses** the production `QuestThread` pattern **without** polluting the **calendar / `EventArtifact`** surface on `/event`.

**Problem:** Dated gatherings and “daily prompt” runs share vocabulary in the UI if both use the same campaign row type without guardrails — invites and `.ics` flows assume calendar semantics.

**Practice:** Deftness — extend existing `EventCampaign.campaignType` string (no new table); block `createEventArtifact` for non-production types; filter campaign pickers.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Type string** | `awareness_content_run` — distinct from `event_production` (default). |
| **Domain / grammar** | Server forces `RAISE_AWARENESS` + `epiphany_bridge` for awareness runs at create time. |
| **Calendar** | **No** `EventArtifact` rows on awareness runs — `createEventArtifact` returns a clear error. |
| **`/event` IA** | Awareness runs appear in a **separate** teal section; gatherings list only **`event_production`** campaigns in “Add gathering”. |
| **Thread editing** | v1: admins link to `/admin/journeys/thread/:id`; stewards see copy to ask an admin (player thread UX = follow-up). |
| **Phase 2** | Subcampaign ontology under parent `campaignRef` — see [BACKLOG.md](../../backlog/BACKLOG.md) **CSC** and [campaign-subcampaigns](../campaign-subcampaigns/spec.md). |

## Conceptual Model

| WHO | WHAT | WHERE |
|-----|------|--------|
| Steward / admin | Creates `EventCampaign` + `QuestThread` | Instance-scoped residency |
| Player | (Future) Daily CYOA / quest steps emit prompt-shaped BARs | CHS spokes + thread quests |
| System | Enforces “no calendar rows” on awareness type | `event-campaign-engine` |

## API Contracts

### `createEventCampaign`

**Input:** Existing fields + optional `campaignType` (`event_production` \| `awareness_content_run`).  
**Output:** `{ success, campaignId, threadId }` \| `{ error }`.

- Awareness run: ignores caller `primaryDomain` / `productionGrammar` for stored values (forced RA + epiphany bridge).

### `createEventArtifact`

**Input:** Unchanged.  
**Output:** Error if parent campaign `campaignType === awareness_content_run`.

### `getEventCampaignsForInstance`

**Output:** Adds `campaignType` and `productionThreadId` per row for UI filtering.

## User Stories

### P1 — Steward creates an awareness run

**As a** steward, **I want** to start a social prompt sprint without fake calendar events, **so** `/event` stays honest for RSVP gatherings.

**Acceptance:** New run appears in “Awareness & social content runs”; “Add gathering” does not list that campaign.

## Functional Requirements

### Phase 1 (shipped)

- **FR1:** `createEventCampaign` persists `campaignType` and validates against known types (`src/lib/event-campaign-types.ts`).
- **FR2:** `createEventArtifact` rejects awareness runs with an explanatory error.
- **FR3:** `/event` filters calendar campaign picker; surfaces awareness section + create modal / admin kernel selector.

### Phase 2 (backlog)

- **FR4:** Passage / BAR metadata schema for “LLM digestible daily prompt” + exporter (BBM-aligned).
- **FR5:** CHS spoke binding to a run id (optional `QuestThread.adventureId` or instance metadata).
- **FR6:** Player-visible thread entry (non-admin).

## Persisted data & Prisma

**v1:** No migration — uses existing `EventCampaign.campaignType` string column (default `event_production`).

| Check | Done |
|-------|------|
| Schema change | N/A (pre-existing column) |
| Migration | N/A |

## Verification Quest

- **Steps:** (manual) Create awareness run on BB instance → confirm it **does not** appear in gathering dropdown → attempt artifact create via API/action if available → expect error → create `event_production` campaign → add gathering succeeds.
- **Cert ID:** defer until automated cert (optional `cert-awareness-content-event-campaign-v1`).

## Dependencies

- [events-bar-framework](../events-bar-framework/spec.md)
- [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md)

## Changelog

| Date | |
|------|--|
| 2026-03-27 | Initial spec kit + implementation (Path A MVP). |
