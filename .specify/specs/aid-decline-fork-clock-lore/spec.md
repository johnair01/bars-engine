# Spec: AID Decline Fork, Clock, and Lore Update

## Purpose

Add a configurable decline clock for AID offers so stewards must respond within a time window; when a steward declines (or the offer expires), the offerer can fork the linked quest and complete it privately. Update lore, foundations, and architecture to reflect BARs Engine as a Jira–GitHub–CYOA bridge with the Architect Game Master as virtual sys-admin teacher.

**Problem**: AID offers have no time pressure; when stewards decline quest-type offers, the offerer has no recourse. The conceptual framing (version management, backlog stewardship, Architect role) is not yet documented.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Decline clock | Configurable TTL (default 24h); `expiresAt` on GameboardAidOffer |
| Expired offers | Treat as declined at read time (no background job) |
| Fork on decline | Offerer receives fork in hand; slot unchanged |
| Config location | `aidOfferTtlHours` in AppConfig.features JSON or Instance |
| Lore updates | New metaphor doc; update FOUNDATIONS, ARCHITECTURE, game-master-sects, conceptual-model |

## Conceptual Model

| Concept | Meaning |
|---------|---------|
| **Decline clock** | Time window for steward to accept or decline; after expiry, offer is treated as declined |
| **Fork on decline** | When steward declines (or offer expires), offerer can fork the linked quest and complete it privately |
| **Version management** | Quests as lightweight version-managed work items; forking mirrors git workflows |
| **Architect Game Master** | Virtual sys-admin teacher who helps players steward the collective backlog with honor and amusement |

**Two cases of steward decline**:
1. **Explicit decline** — Steward clicks Decline
2. **Timeout** — `expiresAt` passes; treated as declined for fork eligibility

## API Contracts (API-First)

### offerAid (extend)

**Input**: `slotId`, `message`, `type`, `linkedQuestId?` (unchanged)  
**Output**: `{ success: true } | { error: string }`

**Change**: Set `expiresAt = createdAt + aidOfferTtlHours` when creating offer.

### forkDeclinedAidQuest (new)

**Input**: `offerId: string`  
**Output**: `{ success: true } | { error: string }`

```ts
function forkDeclinedAidQuest(offerId: string): Promise<{ success?: true; error?: string }>
```

- **Preconditions**: Offer exists; `status` in `['declined']` or `(status === 'pending' && expiresAt < now)`; `type === 'quest'`; `linkedQuestId` set; `offererId === currentPlayer`.
- **Effect**: Fork linked quest via `forkQuestPrivately`; assign to offerer. Optionally mark offer as forked (or hide from list).
- **Server Action** (`'use server'`): Form/button in GameboardClient.

### getDeclinedAidOffersForOfferer (new, or extend getOrCreateGameboardSlots)

**Input**: `playerId: string` (or derive from session)  
**Output**: `{ offers: Array<{ id, linkedQuest, slot, steward, createdAt, expiresAt }> }`

Returns declined/expired quest-type offers where `offererId === playerId`, `type === 'quest'`, `linkedQuestId` not null, not yet forked.

## User Stories

### P1: Decline clock

**As a steward**, I see how long I have to accept or decline an AID offer, so I can prioritize my response.

**Acceptance**:
- Each pending offer shows "Respond by [date]" or "Expires in Xh".
- TTL is configurable (default 24h).
- When `expiresAt` passes, offer is treated as declined (no UI for steward to accept).

### P2: Fork on decline

**As an offerer**, when a steward declines my quest-type AID offer (or it expires), I can fork that quest and complete it privately, so my help doesn't go to waste.

**Acceptance**:
- Offerer sees a "Your declined AID" section when they have declined quest-type offers.
- Each item: "Steward declined your quest offer for [Quest Title]. [Fork and complete it yourself]".
- Button calls `forkDeclinedAidQuest`; fork appears in offerer's hand.

### P3: Lore and metaphor

**As a reader**, I understand BARs Engine as a Jira–GitHub–CYOA bridge and the Architect as sys-admin teacher, so the vision is legible.

**Acceptance**:
- New doc: Jira–GitHub–CYOA metaphorical analysis.
- FOUNDATIONS, ARCHITECTURE, game-master-sects, conceptual-model updated.

## Functional Requirements

### Phase 1: Decline clock

- **FR1**: Add `expiresAt DateTime?` to `GameboardAidOffer`. Set on create as `createdAt + TTL`.
- **FR2**: Read `aidOfferTtlHours` from AppConfig.features (e.g. `{ "aidOfferTtlHours": 24 }`). Default 24 if unset.
- **FR3**: UI: Show expiry on each pending offer ("Respond by [date]" or "Expires in Xh").
- **FR4**: When `status === 'pending' && expiresAt < now`, treat as declined for steward UI and fork eligibility.

### Phase 2: Fork on decline

- **FR5**: `forkDeclinedAidQuest(offerId)` — verify offer, fork linked quest, assign to offerer.
- **FR6**: Fetch declined quest-type offers for current player (offerer). Include expired (read-time).
- **FR7**: UI: "Your declined AID" section with Fork button per offer.

### Phase 3: Lore updates

- **FR8**: Create `docs/JIRA_GITHUB_CYOA_METAPHOR.md` with metaphorical analysis.
- **FR9**: Update `.agent/context/game-master-sects.md`: Architect as sys-admin teacher.
- **FR10**: Update FOUNDATIONS.md: version-managed backlog, Jira–GitHub–CYOA, Architect.
- **FR11**: Update ARCHITECTURE.md: fork lifecycle, AID offer lifecycle, Architect.
- **FR12**: Update `.specify/memory/conceptual-model.md`: version management, backlog stewardship.

## Non-Functional Requirements

- No background jobs for expiry; derive at read time.
- Backward compatible: existing offers without `expiresAt` treated as non-expiring (or migrate).

## Verification Quest (required for UX features)

- **ID**: `cert-aid-decline-fork-v1`
- **Steps**: (1) Offer quest-type AID; (2) Steward declines; (3) Offerer sees "Your declined AID" and forks; (4) Fork appears in hand. Optional: verify expiry countdown on pending offer.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [gameboard-deep-engagement](.specify/specs/gameboard-deep-engagement/spec.md) — AID, forkQuestPrivately

## References

- [src/actions/gameboard.ts](src/actions/gameboard.ts) — offerAid, declineAidOffer, forkQuestPrivately
- [src/app/campaign/board/GameboardClient.tsx](src/app/campaign/board/GameboardClient.tsx) — AID modal, Accept/Decline
- [prisma/schema.prisma](prisma/schema.prisma) — GameboardAidOffer
- [FOUNDATIONS.md](FOUNDATIONS.md), [ARCHITECTURE.md](ARCHITECTURE.md)
- [.agent/context/game-master-sects.md](.agent/context/game-master-sects.md)
