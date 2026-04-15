# Spec: Appreciation Mechanic

## Purpose

Enable players to give vibeulons to another player or to a quest (creator) as appreciation for work seen—closing the "no appreciation before crisis" gap. Aligns with the MVP social loop (another player responds with appreciation) and the System BAR Interaction Layer (appreciation BAR subtype). API-first, deterministic, no AI.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Artifact model | Reuse CustomBar + VibulonEvent; no new top-level models (per system-bar-interaction-layer) |
| Appreciation + vibeulons | Single action: transfer vibeulons with structured appreciation metadata; optionally create appreciation BAR for feed/audit |
| Target resolution | `targetPlayerId` direct; `targetQuestId` → transfer to quest creator (appreciation for authored quest) |
| Route vs Action | Server Action only (forms, React); no external consumers for v1 |

## Conceptual Model (Game Language)

- **Energy** (vibeulons) flows from appreciator to recipient when work is witnessed.
- **WHO**: Sender (appreciator), Recipient (player or quest creator).
- **WHAT**: Appreciation = structured acknowledgment + optional vibeulon transfer. Types: courage, care, clarity, support, creativity, completion.
- **WHERE**: Campaign-visible when `campaignRef` set on optional appreciation BAR.
- **Personal throughput**: Appreciation = Show Up (putting Energy on the line for another's work).

## API Contracts (API-First)

> Define before implementation. Server Action for forms/React.

### sendAppreciationAction

**Input**:
```ts
{
  amount: number                    // vibeulons to transfer (1–10)
  targetPlayerId?: string           // direct: transfer to this player
  targetQuestId?: string           // or: transfer to quest creator
  appreciationType?: 'courage' | 'care' | 'clarity' | 'support' | 'creativity' | 'completion'
  note?: string                    // optional short message
  createAppreciationBar?: boolean  // default true: create CustomBar type=appreciation for feed
}
```

**Output**: `Promise<{ success: true; transferId?: string; barId?: string } | { error: string }>`

- **Server Action** — "Appreciate" button on quest card, player profile, or wallet.
- Constraint: exactly one of `targetPlayerId` or `targetQuestId` required.
- Constraint: `amount` between 1 and 10 (configurable cap).
- Uses existing `transferVibulons`-style logic (FIFO wallet, VibulonEvent source `appreciation`).
- When `createAppreciationBar`: create CustomBar `type: 'appreciation'`, `inputs` JSON: `{ appreciationType, targetType, targetId, amount, note }`, `visibility: 'public'` when campaign context.

### getAppreciationFeed (optional, Phase 2)

**Input**: `{ campaignRef?: string; limit?: number }`  
**Output**: `Promise<{ success: true; appreciations: AppreciationBar[] } | { error: string }>`

- Query CustomBars with `type: 'appreciation'`, optionally filter by `campaignRef`.
- Used by dashboard: "Someone appreciated your quest."

## User Stories

### P1: Give vibeulons to a player as appreciation

**As a player**, I want to send vibeulons to another player with a structured appreciation type (e.g. courage, care), so they know their work is seen and I'm putting Energy on the line.

**Acceptance**: Wallet or player profile has "Appreciate" action. I choose amount (1–10), appreciation type, optional note. Vibeulons transfer; optional appreciation BAR created for feed.

### P2: Give vibeulons to a quest creator

**As a player**, I want to appreciate a quest I found valuable by sending vibeulons to its creator, so quest authors are rewarded for good work.

**Acceptance**: Quest card or detail modal has "Appreciate" button. I choose amount and type. Vibeulons transfer to quest creator; appreciation BAR links to quest via `parentId`.

### P3: See appreciation in feed (Phase 2)

**As a player**, I want to see when someone appreciated my work (quest or BAR), so I feel witnessed.

**Acceptance**: Dashboard or feed shows appreciation BARs where I am the recipient. Optional: Movement Feed includes appreciation events.

## Functional Requirements

### Phase 1: Core Transfer + Optional BAR

- **FR1**: `sendAppreciationAction` MUST transfer `amount` vibeulons from sender to recipient (player or quest creator). Use FIFO wallet; create VibulonEvent with `source: 'appreciation'`, `notes` including appreciationType and target.
- **FR2**: `sendAppreciationAction` MUST validate: sender has sufficient balance; amount 1–10; exactly one of targetPlayerId or targetQuestId; cannot appreciate self.
- **FR3**: When `targetQuestId`: resolve quest creator via `CustomBar.creatorId`; transfer to that player.
- **FR4**: When `createAppreciationBar` (default true): create CustomBar with `type: 'appreciation'`, `inputs` JSON `{ appreciationType, targetType: 'player'|'quest', targetId, amount, note }`, `parentId: targetQuestId` when quest, `creatorId: sender`, `visibility: 'public'` when campaignRef on quest or sender context.
- **FR5**: Reuse existing `transferVibulons` internals (wallet query, token update, VibulonEvent) or extract shared `transferVibeulonsBetweenPlayers(senderId, recipientId, amount, metadata)` for both transfer and appreciation.

### Phase 2: Feed (optional)

- **FR6**: `getAppreciationFeed` returns appreciation BARs for current player as recipient (where targetId = player or targetQuest.creatorId = player).
- **FR7**: Movement Feed (`getMovementFeed`) includes appreciation events when `source: 'appreciation'`.

## Non-Functional Requirements

- Deterministic: no AI. Validation via schema/rules.
- Idempotency: no duplicate transfers for same user intent; no special idempotency key for v1.
- Scaling: same as `transferVibulons` (DB transaction, no large payloads).

## References

- [MVP Social Loop via BARs](../../docs/examples/mvp-social-loop-via-bars.md) — appreciation as response in loop
- [System BAR Interaction Layer](../../docs/architecture/system-bar-interaction-layer.md) — appreciation BAR subtype
- [System BAR API](../../docs/architecture/system-bar-api.md) — createInteractionBar contract
- [Bruised Banana House Integration ANALYSIS](../bruised-banana-house-integration/ANALYSIS.md) — "No appreciation for house work"
- [economy.ts](../../src/actions/economy.ts) — transferVibulons, mintVibulon
- [Deftness Development Skill](../../.agents/skills/deftness-development/SKILL.md)
