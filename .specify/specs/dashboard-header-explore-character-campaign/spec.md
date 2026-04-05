# Spec: Dashboard Header — Explore, Character, Campaign

## Purpose

Reorganize the top of the player dashboard into three clear sections (Explore, Character, Campaign) so players know where to focus. Remove the Act 1/2 button, keep the vibeulon counter (linked to wallet), and give the campaign stage its own prominent button. Use modals for quick facts with links to full pages.

**Problem**: The dashboard header has grown busy with many cards (Act, Global Phase, Vibeulons, Nation, Archetype, Roles, Game Map, Story, Campaign, Request from Library). Players lose focus; the Act 1/2 button adds little value; campaign stage is important but buried in the Kotter gauge.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Section structure | Three labeled sections: **Explore**, **Character**, **Campaign**. Each section groups related cards. |
| Act 1/2 | Remove. No longer necessary for current gameplay. |
| Vibeulon counter | Keep. Always visible, links to `/wallet`. Standalone (not inside a section). |
| Campaign stage | Own button. Click opens modal with stage name, move, progress; link to `/story-clock` for full page. |
| Modals | Each section card can open a modal with vital facts + "View full page →" link. Reduces clutter; deep-dive available. |

## Conceptual Model

| Section | WHO/WHAT | Content | Full Page |
|---------|----------|---------|-----------|
| **Explore** | Navigation, discovery | Game Map, Request from Library | `/game-map`, library modal |
| **Character** | Player identity | Nation, Archetype, Story (Begin the Journey) | `/nation`, `/archetype`, `/campaign` |
| **Campaign** | Collective context | Stage button (Global Phase), Gameboard | `/story-clock`, `/campaign/board?ref=bruised-banana` |

**Energy**: Vibeulons remain top-right, linked to wallet.

## User Stories

### P1: Section clarity

**As a player**, I want the dashboard header grouped into Explore, Character, and Campaign, so I know where to look for each type of action.

**Acceptance**: Three visible section labels; cards grouped under each; layout readable on mobile (stack or wrap).

### P2: Vibeulon counter

**As a player**, I want my vibeulon count visible and clickable to open my wallet, so I can quickly check balance and spend.

**Acceptance**: Vibeulon counter remains; click navigates to `/wallet`.

### P3: Campaign stage prominence

**As a player**, I want the current campaign stage (e.g. Stage 2: Coalition Earth) in its own button, so I know the collective context at a glance.

**Acceptance**: Standalone "Campaign Stage" card; shows stage name + move; click opens modal with details + link to Story Clock.

### P4: Modal facts + full page

**As a player**, I want to click a section card (e.g. Nation, Archetype) and see a modal with key facts and a link to the full page, so I can quick-scan or deep-dive.

**Acceptance**: Each card opens a modal; modal shows vital facts (e.g. nation description, archetype moves); "View full page →" link to dedicated page.

## Functional Requirements

### Phase 1: Layout and removal

- **FR1**: Remove the Act 1/2 card from the dashboard header.
- **FR2**: Keep the Vibeulon counter; ensure it links to `/wallet`.
- **FR3**: Add three section labels: **Explore**, **Character**, **Campaign**.
- **FR4**: Group existing cards under sections:
  - **Explore**: Game Map, Request from Library
  - **Character**: Nation, Archetype, Roles, Story (Begin the Journey)
  - **Campaign**: Campaign Stage (standalone), Gameboard

### Phase 2: Campaign stage button

- **FR5**: Create a standalone "Campaign Stage" card. Display: stage number + name (e.g. "Stage 2: Coalition Earth"), current move (e.g. NURTURE).
- **FR6**: Clicking the Campaign Stage card opens a modal with: stage name, move, brief description, progress bar; "View Story Clock →" link to `/story-clock`.
- **FR7**: Remove or consolidate the existing KotterGauge in the top row; its content moves into the Campaign Stage card/modal.

### Phase 3: Section modals

- **FR8**: Nation card: click opens modal with nation name, short description, link to `/nation` (or nation detail page).
- **FR9**: Archetype card: click opens modal with archetype name, primary move, link to `/archetype`.
- **FR10**: Explore section cards (Game Map, Request from Library): optional modals with brief "what this does" + link to full page.
- **FR11**: Campaign section: Gameboard card links to `/campaign/board`; Campaign Stage modal per FR6.

## Non-Functional Requirements

- Mobile-responsive: sections wrap or stack; modals full-screen on small viewports.
- No new API contracts; uses existing data (player, globalState, KotterGauge data).
- Modals use existing patterns (e.g. Dialog, click-outside to close, Escape).

## Out of Scope

- Redesign of full pages (`/nation`, `/archetype`, `/story-clock`).
- New data for modals; use existing player.nation, player.archetype, globalState.

## Dependencies

- [dashboard-ui-vibe-cleanup](.specify/specs/dashboard-ui-vibe-cleanup/spec.md)
- KotterGauge, getGlobalState, KOTTER_STAGES
- src/app/page.tsx (dashboard header)

## References

- [src/app/page.tsx](../../../src/app/page.tsx) — dashboard header (lines ~400–470)
- [src/components/KotterGauge.tsx](../../../src/components/KotterGauge.tsx)
- [src/lib/kotter.ts](../../../src/lib/kotter.ts) — KOTTER_STAGES
