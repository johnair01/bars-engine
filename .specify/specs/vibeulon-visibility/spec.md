# Spec: Vibeulon Visibility (Movement Feed)

## Purpose

Surface a **movement feed** showing "who earned what, for what" — so players see Energy (vibeulons) flowing through the space. This supports the Bruised Banana campaign goal: making contribution visible and celebratory.

**Extends**: [Bruised Banana House Integration](../bruised-banana-house-integration/ANALYSIS.md) Phase 3.1

## Conceptual Model (Game Language)

- **Energy** = vibeulons
- **Movement feed** = chronological list of vibeulon-earning events: who earned, how much, for what (quest/source)
- **Personal throughput** = 4 moves; quest completion mints vibeulons

## User Story

**As a player**, I want to see a feed of recent vibeulon activity (who earned what, for what quest) so I feel the Energy moving through the space and am motivated to contribute.

**Acceptance**:
1. A movement feed displays recent vibeulon-earning events (amount > 0).
2. Each event shows: player name, amount earned, source (quest title or source label).
3. Feed is visible on dashboard and/or wallet.
4. Feed is scoped: global (all players) or instance-level when in event mode.

## Functional Requirements

- **FR1**: A movement feed MUST display VibulonEvent records where `amount > 0`, ordered by `createdAt` descending.
- **FR2**: Each feed item MUST show: player name (or anonymized if privacy), amount, and "for what" (quest title from `notes` or `questId` lookup, or source label).
- **FR3**: Feed MUST support pagination or limit (e.g. 20 items) for performance.
- **FR4**: Feed MAY be scoped by `instanceId` when instance/event mode is active (future: VibulonEvent.instanceId). v1: global feed.
- **FR5**: Feed MUST be visible on at least one surface: dashboard (`/`) or wallet (`/wallet`).

## Non-Functional Requirements

- Use existing VibulonEvent schema; no schema change for v1.
- Query must be efficient (index on createdAt; limit results).
- Anonymization: if player prefers, show "A player" instead of name (future). v1: show names.

## Data Model (Existing)

VibulonEvent: `playerId`, `source`, `amount`, `notes`, `archetypeMove`, `questId`, `createdAt`

- `source = 'quest'` → earned from quest completion; `notes` includes quest title; `questId` links to CustomBar
- `source = 'completion_effect'` → bonus from quest
- `source = 'p2p_transfer'` → received from another player; `notes` includes sender

## Verification Quest

- Add step to cert-two-minute-ride-v1 or new cert quest: "Confirm movement feed visible on dashboard or wallet showing who earned vibeulons."

## Out of Scope (v1)

- Instance-scoped feed (VibulonEvent has no instanceId)
- Anonymization toggle
- Real-time updates (polling or SSE)

## Reference

- VibulonEvent schema: [prisma/schema.prisma](../../prisma/schema.prisma)
- Quest completion mint: [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts)
- Wallet page: [src/app/wallet/page.tsx](../../src/app/wallet/page.tsx)
- Dashboard: [src/app/page.tsx](../../src/app/page.tsx)
