# Spec: Mobile UI Redesign (Game Loop + Deftness)

## Purpose

Align the Mobile UI with the main game loop (Capture → Extend → Play → Complete), using BAR Card as the foundation component. Merge Forge + Charge Capture into a single entry. Rename Market → Campaign Deck, introduce BARs Deck. API-first, spec kit first.

**Problem**: BAR surfaces are fragmented (VibeBarCard, StoryBarCard, list rows, deck cards). Capture and Create BAR are separate flows. Market naming is unclear.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **BAR Card** | Single canonical component for all BAR display (Feed, Detail, Deck, Share export) |
| **Naming** | BARs Deck = `/hand/deck` (daily hand, BAR bindings). Campaign Deck = `/bars/available` (collective quest pool) |
| **Forge** | Merge Charge Capture + Create BAR into one flow. "The Forge" = single entry for creating BARs |
| **Conversion** | No schema migration. CustomBar → BarCardData at read time via `mapCustomBarToBarCardData` |

## Game Loop Mapping

| Loop Step | Mobile UI Screen | Current Route |
|-----------|------------------|---------------|
| **Capture** | The Forge (merge Capture) | `/capture`, CreateBarForm on `/hand` |
| **Extend** | BAR Detail + flip | `/bars/[id]`, `/capture/explore/[barId]` |
| **Play** | BARs Deck | `/hand/deck` |
| **Play** | Campaign Deck | `/bars/available` |
| **Complete** | (implicit) | Gameboard, Wallet |
| **Social** | BAR Feed, Share, Reply, Remix | `/bars/feed`, interaction-bars |

## API Contracts (API-First)

### getBarCardData

**Input**: `barId: string`  
**Output**: `{ success: true; data: BarCardData } | { error: string }`

```ts
async function getBarCardData(barId: string): Promise<
  | { success: true; data: BarCardData }
  | { error: string }
>

type BarCardData = {
  id: string
  title: string
  description: string
  type: string
  chargeType: 'anger' | 'joy' | 'sadness' | 'fear' | 'neutrality'
  createdAt: string
  creatorName?: string
  status: string
}
```

- **Route vs Action**: Server Action. Internal use (BarCard consumers).
- **Access**: Same as getBarDetail — owner, recipient, or public.

### createBarForge (Phase 2)

**Input**: `CreateBarForgePayload` (merge of CreateChargeBarPayload + optional structure)  
**Output**: `{ success: true; barId: string } | { error: string }`

- Merges `createChargeBar` and `createPlayerBar` flows.

### exportBarCardAsImage (Phase 5)

**Input**: `barId: string`  
**Output**: `{ success: true; imageDataUrl: string } | { error: string }`

- Client-side canvas or Server Action. Uses BarCard component for export.

## BAR Conversion Plan (Existing BARs → BarCardData)

No schema migration. Conversion = mapping CustomBar → BarCardData at read time.

| CustomBar.type | chargeType Source |
|----------------|-------------------|
| `charge_capture` | `inputs.emotion_channel` |
| All others | `'neutrality'` |

**Edge glow palette**: anger→red, joy→green, sadness→blue, fear→white, neutrality→amber/gray.

## User Stories

### P1: BarCard foundation

**As a player**, I want all BARs to render with a consistent card design (poker proportions, paper texture, edge glow by charge type), so the experience feels unified.

**Acceptance**: BarCard component exists; getBarCardData returns BarCardData; at least one consumer uses it.

### P2: The Forge (merge Capture)

**As a player**, I want one place to create BARs—quick capture or full structure—so I don't navigate between Capture and Create BAR.

**Acceptance**: The Forge combines ChargeCaptureForm and CreateBarForm; Seal = minimal, Forge = full.

### P3: BARs Deck and Campaign Deck naming

**As a player**, I want clear names for my hand vs the collective quest pool, so I know where to go.

**Acceptance**: `/hand/deck` labeled "BARs Deck"; `/bars/available` labeled "Campaign Deck".

## Functional Requirements

### Phase 0: Conversion layer

- **FR0.1**: Implement `mapCustomBarToBarCardData(bar)` — derive BarCardData from CustomBar
- **FR0.2**: Implement `getBarCardData(barId)` Server Action
- **FR0.3**: Add `BarCardData` type to `src/features/bar-system/types` or `src/lib/bar-card-data.ts`

### Phase 1: BarCard component

- **FR1.1**: Create BarCard component with props: `data: BarCardData`, `variant: 'compact' | 'full' | 'flip' | 'export'`
- **FR1.2**: Edge glow by chargeType (5-element palette)
- **FR1.3**: Poker-card proportions, paper texture (CSS)

### Phase 2: The Forge

- **FR2.1**: Merge ChargeCaptureForm and CreateBarForm into The Forge
- **FR2.2**: Quick capture mode (Seal) and full mode (Forge)
- **FR2.3**: Update nav: replace "Capture" and "Create BAR" with "The Forge"

### Phase 3: BAR Detail + flip

- **FR3.1**: BAR Detail uses BarCard full variant
- **FR3.2**: Flip interaction (front/back)

### Phase 4: Deck grids

- **FR4.1**: BARs Deck and Campaign Deck use BarCard compact variant
- **FR4.2**: Rename Market → Campaign Deck in UI

### Phase 5: Share image export

- **FR5.1**: exportBarCardAsImage or client-side canvas
- **FR5.2**: Share flow produces image from BarCard

## Non-Functional Requirements

- No schema changes to CustomBar
- Backward compatible: existing routes remain functional during rollout
- All imported modules committed (Module Graph Hygiene)

## Verification Quest

- **ID**: `cert-mobile-ui-game-loop-v1`
- **Steps**: Dashboard → The Forge (capture) → BAR Detail → BARs Deck or Campaign Deck → Share
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [Game Loop Integration](.specify/specs/game-loop-integration/spec.md)
- [Charge Capture UX](.specify/specs/charge-capture-ux-micro-interaction/spec.md)
- [Dashboard UI Feedback](.specify/specs/dashboard-ui-feedback-march-2025/spec.md)

## References

- [Mobile UI Plan](.specify/specs/mobile-ui-redesign/plan.md)
- [Deftness Development](.agents/skills/deftness-development/SKILL.md)
- [Bar System v1](docs/architecture/bar-system-v1.md)
