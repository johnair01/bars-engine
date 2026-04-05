# Spec: Dashboard Section Modal Buttons

## Purpose

Streamline the dashboard header by turning **Explore**, **Character**, and **Campaign** into primary buttons. Clicking a section button opens a modal that contains the existing action buttons (Game Map, Request from Library, etc.) plus a link to the main page for that section. Reduces visual clutter while keeping all actions one click away.

**Problem**: The current layout shows three section headers with multiple cards under each. The header is still busy. Players want a cleaner top-level view with quick access to section contents via modals.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Primary UI | Three buttons only: **Explore**, **Character**, **Campaign**. Vibeulon counter remains. |
| Section content | Move all existing cards (Game Map, Nation, Archetype, etc.) inside modals. |
| Modal structure | Each modal: (1) section title, (2) existing action buttons, (3) "View full page →" link to main section page. |
| Main page links | Explore → `/game-map`; Character → `/campaign`; Campaign → `/campaign/board?ref=bruised-banana` |

## Conceptual Model

| Section | Modal Contents | Main Page |
|---------|----------------|-----------|
| **Explore** | Game Map, Request from Library | `/game-map` |
| **Character** | Nation, Archetype, Roles, Story (Begin the Journey) | `/campaign` |
| **Campaign** | Campaign Stage, Gameboard | `/campaign/board?ref=bruised-banana` |

**Energy**: Vibeulon counter stays visible; links to `/wallet`.

## User Stories

### P1: Section buttons

**As a player**, I want Explore, Character, and Campaign as three primary buttons in the dashboard header, so the top of the page is clean and scannable.

**Acceptance**: Three buttons visible; no cards shown by default; Vibeulon counter remains.

### P2: Modal access

**As a player**, I want to click a section button and see a modal with all actions for that section, so I can choose what to do without leaving the dashboard.

**Acceptance**: Each button opens a modal; modal contains the same action buttons that exist today (Game Map, Nation, Archetype, etc.); buttons work as before (navigate or open sub-modals).

### P3: Full page link

**As a player**, I want a "View full page →" link in each section modal, so I can go to the main hub for that section when I want the full experience.

**Acceptance**: Each modal has a prominent link to the section's main page.

## Functional Requirements

### Phase 1: Section buttons

- **FR1**: Replace the current section layout (labels + cards) with three primary buttons: **Explore**, **Character**, **Campaign**.
- **FR2**: Each button is visually distinct (e.g. different border/accent color or icon) so players can quickly identify sections.
- **FR3**: Vibeulon counter remains in the top row; unchanged.

### Phase 2: Section modals

- **FR4**: **Explore modal** — Opens on Explore button click. Contains: Game Map (link to `/game-map`), Request from Library (existing LibraryRequestButton). Footer: "View full page →" link to `/game-map`.
- **FR5**: **Character modal** — Opens on Character button click. Contains: Nation (NationCardWithModal or link), Archetype (ArchetypeCardWithModal or link), Roles (read-only display), Story (link to `/campaign`). Footer: "View full page →" link to `/campaign`.
- **FR6**: **Campaign modal** — Opens on Campaign button click. Contains: Campaign Stage (CampaignStageCard or inline stage info), Gameboard (link to `/campaign/board?ref=bruised-banana`). Footer: "View full page →" link to `/campaign/board?ref=bruised-banana`.
- **FR7**: Modals support Escape and click-outside to close. Reuse existing modal patterns (AvatarModal, CampaignStageModal).

### Phase 3: Nested modals

- **FR8**: Nation and Archetype inside Character modal may still open their own detail modals (NationModal, ArchetypeModal) when clicked. Campaign Stage inside Campaign modal may open CampaignStageModal. Preserve existing behavior.
- **FR9**: LibraryRequestButton inside Explore modal works as before (opens LibraryRequestModal or navigates).

## Non-Functional Requirements

- Mobile-responsive: section buttons wrap; modals full-screen or near-full on small viewports.
- No new API contracts; reuse existing components and data.
- Modal stacking: if NationModal opens from Character modal, closing NationModal returns to Character modal (not dashboard).

## Out of Scope

- Redesign of main section pages.
- Changing what each action button does.

## Dependencies

- [dashboard-header-explore-character-campaign](.specify/specs/dashboard-header-explore-character-campaign/spec.md) — existing section structure, NationCardWithModal, ArchetypeCardWithModal, CampaignStageCard
- src/app/page.tsx
- LibraryRequestButton, CampaignStageModal, NationModal, ArchetypeModal

## References

- [src/app/page.tsx](../../../src/app/page.tsx) — dashboard header
- [src/components/dashboard/](../../../src/components/dashboard/) — existing section components
