# Plan: Dashboard Header — Explore, Character, Campaign

## Overview

Reorganize the dashboard header into three sections (Explore, Character, Campaign), remove Act 1/2, keep vibeulon counter, give campaign stage its own button with modal, and add modals for section cards with links to full pages.

## Implementation Order

### 1. Remove Act 1/2

- Delete the Act card div from `src/app/page.tsx` (lines ~409–413).
- No other references to `globalState.currentAct` in header; keep for admin/story-clock if needed.

### 2. Section structure

- Wrap the second row of cards in three `<section>` or `<div>` groups with labels.
- **Explore**: Game Map, Request from Library
- **Character**: Nation, Archetype, Roles, Story (Begin the Journey)
- **Campaign**: Campaign Stage (new), Gameboard

- Add section headings: "Explore", "Character", "Campaign" (small uppercase labels).

### 3. Campaign Stage button

- Extract KotterGauge data (stage, name, move) into a compact card.
- Card shows: "Stage N: Name" + move badge.
- Link or button opens modal.
- Modal component: `CampaignStageModal` — stage info, progress bar, "View Story Clock →" link.

### 4. Section modals

- **NationModal**: nation name, short description (from nation.content or handbook), link to `/nation`.
- **ArchetypeModal**: archetype name, primary move, link to `/archetype`.
- **CampaignStageModal**: per step 3.
- Optional: GameMapModal, LibraryRequestModal (if "what this does" copy is useful).

### 5. Layout and styling

- Ensure sections wrap on mobile.
- Modals: use Radix Dialog or similar; Escape + click-outside to close.
- Preserve existing card styling (borders, colors) for consistency.

## Files to Modify

| File | Change |
|------|--------|
| `src/app/page.tsx` | Remove Act; add section structure; integrate Campaign Stage card; wire modals |
| `src/components/CampaignStageModal.tsx` | New: modal for campaign stage |
| `src/components/NationModal.tsx` | New: modal for nation (or extend DashboardAvatarWithModal pattern) |
| `src/components/ArchetypeModal.tsx` | New: modal for archetype |

## Verification

1. Load dashboard; confirm Act 1/2 is gone.
2. Confirm three sections visible: Explore, Character, Campaign.
3. Click Vibeulons → navigates to `/wallet`.
4. Click Campaign Stage → modal opens; "View Story Clock" → `/story-clock`.
5. Click Nation → modal with nation info + link to `/nation`.
6. Click Archetype → modal with archetype info + link to `/archetype`.
7. Mobile: sections stack or wrap; modals usable.
