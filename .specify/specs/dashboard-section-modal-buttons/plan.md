# Plan: Dashboard Section Modal Buttons

## Overview

Replace the current section layout (labels + cards) with three primary buttons. Each button opens a modal containing the existing action buttons plus a "View full page →" link.

## Implementation Order

### 1. Create section modal components

- **ExploreModal** — Renders Game Map link, LibraryRequestButton; footer link to `/game-map`.
- **CharacterModal** — Renders NationCardWithModal, ArchetypeCardWithModal, Roles, Story link; footer link to `/campaign`. Receives `player` (or subset) as props.
- **CampaignModal** — Renders CampaignStageCard, Gameboard link; footer link to `/campaign/board?ref=bruised-banana`. Receives `globalStage` as prop.

### 2. Create section button components

- **ExploreSectionButton** — Button labeled "Explore"; onClick opens ExploreModal.
- **CharacterSectionButton** — Button labeled "Character"; onClick opens CharacterModal.
- **CampaignSectionButton** — Button labeled "Campaign"; onClick opens CampaignModal.

Or: single **DashboardSectionButtons** client component that renders all three and manages modal state.

### 3. Update page.tsx

- Remove the current section layout (the three `<section>` blocks with cards).
- Add the three section buttons (or DashboardSectionButtons).
- Pass required data: player (nation, archetype, roles), globalStage.
- Keep Vibeulon counter.

### 4. Modal layout

Each modal:
- Header: section name (e.g. "Explore")
- Body: grid or list of action buttons (reuse existing card styling)
- Footer: "View full page →" link

### 5. Nested modals

NationCardWithModal, ArchetypeCardWithModal, CampaignStageCard open their own modals when clicked. These work inside the section modals—no change needed. When a nested modal closes, focus returns to the section modal.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/dashboard/ExploreModal.tsx` | Create |
| `src/components/dashboard/CharacterModal.tsx` | Create |
| `src/components/dashboard/CampaignModal.tsx` | Create |
| `src/components/dashboard/DashboardSectionButtons.tsx` | Create (client; renders 3 buttons + 3 modals) |
| `src/app/page.tsx` | Replace section layout with DashboardSectionButtons |

## Verification

1. Dashboard shows three section buttons + Vibeulon counter.
2. Click Explore → modal opens with Game Map, Request from Library, "View full page →".
3. Click Character → modal opens with Nation, Archetype, Roles, Story, "View full page →".
4. Click Campaign → modal opens with Campaign Stage, Gameboard, "View full page →".
5. Nested modals (Nation, Archetype, Campaign Stage) still work from within section modals.
6. Mobile: buttons wrap; modals usable.
