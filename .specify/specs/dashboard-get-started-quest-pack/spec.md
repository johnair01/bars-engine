# Spec: Get Started as Wake Up Quest Pack

## Purpose

Transform "Get Started" from a static feature-discovery block into a Wake Up Quest Pack. Once all pages have been visited, the pack completes and rewards a vibeulon. The block is collapsible and dismissible; it leaves the dashboard when complete. Each page has system quests that demonstrate concept understanding.

**Problem**: Get Started is always visible and feels like clutter. It doesn't reward engagement or verify understanding.

**Practice**: Quest-driven onboarding — visit pages, complete system quests, earn vibeulon, dismiss.

## User Stories

### P1: Collapsible and Dismissible

**As a** player, **I want** Get Started to be collapsible and dismissible, **so** I can hide it when I'm not using it.

**Acceptance**: Header toggles expand/collapse; dismiss button hides it until next session or permanently when complete.

### P2: Visit-Based Completion

**As a** player, **I want** Get Started to complete when I've visited all pages (BARs, Quests, EFA, Donate, Daemons), **so** I earn a vibeulon and the block leaves the dashboard.

**Acceptance**: Visit tracking; completion = all 5 pages visited; vibeulon minted; block hidden.

### P3: System Quests per Page

**As a** player on each Get Started page, **I want** system quests that demonstrate I understand the concept, **so** I can prove comprehension and earn additional rewards.

**Acceptance**: Each page (BARs, Quests, EFA, Donate, Daemons) has 1–2 system quests; completion tracked; optional vibeulon or progress toward pack completion.

## Functional Requirements

### FR1: Get Started Block

- **FR1a**: CollapsibleSection wrapper; default expanded for new players.
- **FR1b**: Dismiss button (X or "Hide for now"); persists via localStorage or player preference.
- **FR1c**: When pack is complete, block does not render on dashboard.

### FR2: Visit Tracking

- **FR2a**: Track visits to: /wiki/bars-guide, /wiki/quests-guide, /wiki/emotional-first-aid-guide, /wiki/donation-guide, /daemons.
- **FR2b**: Store in PlayerGetStartedProgress or equivalent (playerId, pageKey, visitedAt).
- **FR2c**: Completion = all 5 pages visited at least once.

### FR3: Pack Completion

- **FR3a**: On completion, mint 1 vibeulon to player.
- **FR3b**: Mark pack complete in DB; block hidden on subsequent dashboard loads.

### FR4: System Quests per Page

- **FR4a**: Define system quests for each page (e.g., "Create a BAR" for BARs, "Complete one EFA session" for EFA).
- **FR4b**: Quest completion contributes to pack completion or grants bonus vibeulon.
- **FR4c**: Quests are discoverable from the Get Started block or the page itself.

## Non-functional Requirements

- Schema: PlayerGetStartedProgress or extend existing onboarding/quest progress.
- Backward compatible: existing players without progress see block; completion is optional.

## Dependencies

- [docs/UI_STYLE_GUIDE.md](../../../docs/UI_STYLE_GUIDE.md) — Collapsible, uncluttered
- Quest completion flow, vibeulon minting

## Out of Scope (Phase 1)

- Full quest modal UI (block can be simplified first)
- Multi-step verification per page
