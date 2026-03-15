# Spec: Dashboard Collapsible Sections (Active Quests & Journeys)

## Purpose

Reduce dashboard clutter by making Active Quests and Journeys sections collapsible. Aligns with [docs/UI_STYLE_GUIDE.md](../../../docs/UI_STYLE_GUIDE.md): keep the UI uncluttered even when user-generated content is abundant.

**Problem**: Players with many active quests and journeys see a busy, overwhelming dashboard. The interface does not scale with content volume.

**Practice**: Progressive disclosure — show section headers with counts; let users expand to see content.

## User Stories

### P1: Collapsible Active Quests

**As a** player with active quests, **I want** the Active Quests section to be collapsible, **so** I can hide it when I'm not working on quests and keep the dashboard calm.

**Acceptance**: Section has a clickable header; toggles between collapsed (header + count only) and expanded (full StarterQuestBoard).

### P2: Collapsible Journeys

**As a** player with quest threads or packs, **I want** the Journeys section to be collapsible, **so** I can focus on one area at a time.

**Acceptance**: Section has a clickable header; toggles between collapsed and expanded.

### P3: Count Badges

**As a** player, **I want** to see how many items are in each section without expanding, **so** I know what's waiting for me.

**Acceptance**: Section headers show count badges (e.g., "Active Quests (5)", "Journeys (3)").

### P4: Sensible Defaults

**As a** player with few items, **I want** sections expanded by default. **As a** player with many items, **I want** sections collapsed by default to reduce initial clutter.

**Acceptance**: Default collapsed when count exceeds threshold (e.g., >3 for Journeys, >5 for Active Quests); otherwise expanded.

## Functional Requirements

### FR1: Active Quests Section

- **FR1a**: Wrap Active Quests section in a collapsible container.
- **FR1b**: Header shows "Active Quests" and count of active bars (e.g., "Active Quests (7)").
- **FR1c**: Clicking header toggles expanded/collapsed. Chevron or icon indicates state.
- **FR1d**: Default: collapsed when `activeBars.length > 5`; otherwise expanded.
- **FR1e**: Persist user preference in `localStorage` (optional Phase 2) or session; for Phase 1, use count-based default only.

### FR2: Journeys Section

- **FR2a**: Wrap Journeys section (threads + packs) in a collapsible container.
- **FR2b**: Header shows "Journeys" and count of active threads + packs.
- **FR2c**: Clicking header toggles expanded/collapsed.
- **FR2d**: Default: collapsed when `(threads + packs).length > 3`; otherwise expanded.

### FR3: Graveyard (Optional Phase 2)

- **FR3a**: If Graveyard has many completed items, consider collapsible; lower priority than Active Quests and Journeys.

## Non-functional Requirements

- Client-side only; no schema changes.
- Accessible: keyboard toggle, aria-expanded, aria-controls.
- Smooth transition (CSS or minimal JS) when expanding/collapsing.

## Dependencies

- [Dashboard UI Vibe Cleanup](../dashboard-ui-vibe-cleanup/spec.md) — FR8 (active quests default closed) addresses individual quest cards; this spec addresses whole sections.
- [docs/UI_STYLE_GUIDE.md](../../../docs/UI_STYLE_GUIDE.md) — Uncluttered-by-default principle.

## Out of Scope

- localStorage persistence of collapse state (Phase 2).
- Collapsible Graveyard (Phase 2).
- Collapsible Available Quests or other sections.
