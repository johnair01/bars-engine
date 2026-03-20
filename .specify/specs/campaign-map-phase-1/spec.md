# Spec: Campaign Map — Phase 1 (Opening Momentum)

## Purpose

Implement the initial Campaign Map layer for the Bruised Banana Residency campaign. The Campaign Map provides players with situational awareness of the current campaign phase, visible activity in the system, and available areas of contribution. This spec extends the existing gameboard rather than replacing it — the current gameboard is the MVP of Layer 1.

**Problem**: Players lack a unified view of where they are in the campaign, where activity is happening, and where they can contribute. The gameboard shows slots but not domain context or field signals.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Extend vs replace | Extend the gameboard at `/campaign/board`; do not replace. Current gameboard = MVP of Layer 1. |
| Phase model | Phase 1: Opening Momentum is fixed for this spec. Phase advancement logic deferred to future specs. |
| Phase mapping | Phase 1 maps to Kotter Stage 1 (Urgency) for Bruised Banana. Use `instance.kotterStage` or campaign phase config. |
| Domain regions | Four regions: Gather Resources, Skillful Organizing, Raise Awareness, Direct Action. Map to `allyshipDomain` enum. |
| Field signals | Observational only; derived from system metrics. Do not gate gameplay. |

## Conceptual Model (Game Language)

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Player (completer), Campaign Owner |
| **WHAT** | Campaign Map = three layers; Gameboard = quest slots within it |
| **WHERE** | Allyship domains (GATHERING_RESOURCES, SKILLFUL_ORGANIZING, RAISE_AWARENESS, DIRECT_ACTION) |
| **Energy** | Vibeulons — minted on completion; field signals reflect activity |
| **Personal throughput** | 4 moves; Map shows where work is happening |

**Campaign Map** = situational awareness surface. Layer 1 = phase context; Layer 2 = domain regions; Layer 3 = field activity.

## API Contracts

### getCampaignPhaseHeader(instanceId, campaignRef)

**Input**: `{ instanceId: string; campaignRef: string }`  
**Output**: `{ campaignName: string; phase: string; phaseDescription: string }`

```ts
function getCampaignPhaseHeader(instanceId: string, campaignRef: string): Promise<{
  campaignName: string
  phase: string
  phaseDescription: string
}>
```

- Returns campaign name, phase label (e.g. "Opening Momentum"), and player-facing description.
- Phase 1 = "Opening Momentum" with fixed description.

### getDomainRegionCounts(campaignRef, period)

**Input**: `{ campaignRef: string; period?: number }`  
**Output**: `{ domain: string; questCount: number; activePlayerCount: number }[]`

```ts
function getDomainRegionCounts(
  campaignRef: string,
  period?: number
): Promise<Array<{ domain: string; questCount: number; activePlayerCount: number }>>
```

- Returns per-domain counts for the four allyship domains.
- `domain` = GATHERING_RESOURCES | SKILLFUL_ORGANIZING | RAISE_AWARENESS | DIRECT_ACTION.

### getFieldActivityIndicators(campaignRef)

**Input**: `campaignRef: string`  
**Output**: `{ barCount: number; completionCount: number; activePlayerCount: number; fundingProgress?: number }`

```ts
function getFieldActivityIndicators(campaignRef: string): Promise<{
  barCount: number
  completionCount: number
  activePlayerCount: number
  fundingProgress?: number
}>
```

- Observational metrics only. Do not gate gameplay.

## User Stories

### P1: Campaign phase header (Layer 1)

**As a player**, I want to see the campaign name, current phase, and phase description when I land on the Campaign Map, so I understand where the residency is.

**Acceptance**: Campaign Map displays: Bruised Banana Residency, Phase: Opening Momentum, and the phase description.

### P2: Domain regions (Layer 2)

**As a player**, I want to see four domain regions with quest counts and active players, so I can choose where to contribute.

**Acceptance**: Four regions display (Gather Resources, Skillful Organizing, Raise Awareness, Direct Action). Each shows quest count and active player count. Clicking a region reveals quests associated with that domain.

### P3: Field activity indicators (Layer 3)

**As a player**, I want to see system activity signals (BARs created, completions, active players), so I sense the living field.

**Acceptance**: Observational indicators display. They reflect player behavior; they do not gate gameplay.

### P4: Post-onboarding redirect to Campaign Map

**As a new player**, I want to land on the Campaign Map after completing onboarding, so I immediately see where I can contribute.

**Acceptance**: Configurable post-onboarding redirect; when set to Campaign Map, redirect to `/campaign/board`.

## Functional Requirements

### Phase 1: Layer 1 — Campaign Phase Header

- **FR1**: Campaign Map displays campaign name (e.g. "Bruised Banana Residency"), phase label ("Phase: Opening Momentum"), and phase description.
- **FR2**: Phase 1 description (player-facing): "The residency has begun. Players are gathering resources, organizing collaborators, raising awareness, and testing the early structure of the game."
- **FR3**: Implement `getCampaignPhaseHeader` server action or data fetcher. Phase 1 is fixed; no phase advancement in this spec.

### Phase 2: Layer 2 — Domain Regions

- **FR4**: Display four domain regions: Gather Resources, Skillful Organizing, Raise Awareness, Direct Action.
- **FR5**: Each region displays: number of active quests, number of players currently active in that region.
- **FR6**: Selecting a region reveals quests associated with that domain (filter gameboard slots or deck by `allyshipDomain`).
- **FR7**: Implement `getDomainRegionCounts` to aggregate quests and activity by domain.

### Phase 3: Layer 3 — Field Activity Indicators

- **FR8**: Display field activity indicators: BARs created, recent quest completions, active player count, optional funding progress.
- **FR9**: Implement `getFieldActivityIndicators`. Observational only.
- **FR10**: Optional: emergent field signals (e.g. "Curiosity rising", "Coordination needed") derived from heuristics. Informational only.

### Phase 4: Post-Onboarding Integration

- **FR11**: Add config option for post-onboarding redirect: `'dashboard' | 'campaign-map'`. When `'campaign-map'`, redirect to `/campaign/board` after onboarding completion.
- **FR12**: Integrate with `getDashboardRedirectForPlayer` or equivalent in campaign/conclave auth flow.

## Non-Functional Requirements

- Backward compatible: existing gameboard behavior preserved. Campaign Map layers are additive.
- No schema changes required for Phase 1; use existing `CustomBar.allyshipDomain`, `GameboardSlot`, etc.
- Field signals are read-only; no writes from this feature.

## Verification Quest (required for UX features)

- **ID**: `cert-campaign-map-phase-1-v1`
- **Steps**: (1) Complete onboarding; (2) Land on Campaign Map (or navigate to `/campaign/board`); (3) Confirm Layer 1 header; (4) Confirm four domain regions; (5) Confirm field activity indicators; (6) Click a domain region; confirm quests display.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/spec.md)

## Dependencies

- [gameboard-campaign-deck](../gameboard-campaign-deck/spec.md) — gameboard exists; Campaign Map extends it
- [gameboard-quest-generation](../gameboard-quest-generation/spec.md) — deck, slots, period
- [campaign-kotter-domains](../campaign-kotter-domains/spec.md) — Kotter stage, allyship domains
- [dashboard-orientation-flow](../dashboard-orientation-flow/spec.md) — post-signup redirect; extend for Campaign Map

## References

- [INTEGRATION.md](./INTEGRATION.md) — how the map sits in the larger system (routes, keys, redirect config)
- [src/app/campaign/board/page.tsx](../../src/app/campaign/board/page.tsx)
- [src/app/campaign/board/GameboardClient.tsx](../../src/app/campaign/board/GameboardClient.tsx)
- [src/lib/campaign-map.ts](../../src/lib/campaign-map.ts)
- [src/lib/campaign-map-shared.ts](../../src/lib/campaign-map-shared.ts)
- [src/lib/gameboard.ts](../../src/lib/gameboard.ts)
- [.specify/memory/allyship-domain-definitions.md](../../.specify/memory/allyship-domain-definitions.md)
