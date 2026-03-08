# Spec: Admin Quest Edit from Dashboard

## Purpose

When an admin is logged in and viewing a quest from the player dashboard (including quests embedded in journeys), they should see a direct link to edit the quest. From there they can extend it into a CYOA experience via the existing Upgrade to CYOA flow. This closes the gap between "playing as admin" and "editing quests" without navigating away to Admin → Quests and hunting for the quest.

## User Stories

**As an admin**, when I reach a quest while logged in (from the dashboard, whether in a journey thread or pack), I want to see an option to edit the quest, so I can quickly fix copy, tweak config, or extend it into a CYOA without leaving the player flow.

**As an admin**, I want the edit link to take me to the existing Admin → Quests → [quest] page, where I can use the full config form and the "Upgrade to CYOA" flow, so I have a single path from discovery to extension.

## Perceived vs Desired Behavior

| Perceived | Desired |
|-----------|---------|
| Admin views quest in journey; no edit link | Admin sees "Edit quest" (or "Config") link in quest modal |
| Must navigate to Admin → Quests and search for the quest | One click from quest modal → edit page |

## Functional Requirements

### FR1: Admin Edit Link in QuestDetailModal

- **FR1a**: `QuestDetailModal` MUST accept an optional `isAdmin?: boolean` prop.
- **FR1b**: When `isAdmin` is true, the modal header MUST display a link/button to `/admin/quests/[quest.id]` (e.g. "Edit quest" or "Config").
- **FR1c**: The link MUST be visually distinct (e.g. small admin-style badge or icon) and not clutter the player experience.
- **FR1d**: When `isAdmin` is false or undefined, no admin link is shown.

### FR2: isAdmin Propagation

- **FR2a**: The home page (`src/app/page.tsx`) MUST derive `isAdmin` from the current player's roles (e.g. `player?.roles?.some(r => r.role.key === 'admin')`).
- **FR2b**: `QuestThread` and `QuestPack` MUST accept an optional `isAdmin?: boolean` prop.
- **FR2c**: When rendering `QuestDetailModal`, both components MUST pass `isAdmin` through.

### FR3: TwineQuestModal (Optional)

- **FR3a**: When `TwineQuestModal` is used for quests with full Twine journeys, consider adding an admin edit link in that modal as well (Phase 2). For v1, the edit link in `QuestDetailModal` is sufficient when the player opens the quest before launching Twine.

## Non-Functional Requirements

- Admin-only; no schema changes.
- No new routes; reuse `/admin/quests/[id]` and existing `UpgradeQuestToCYOAFlow`.
- Minimal UI impact; admin link should not distract non-admin players.

## Implementation Notes

- **Surfaces**: `QuestDetailModal`, `QuestThread`, `QuestPack`, `src/app/page.tsx`
- **Admin check**: `player?.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')` (matches existing pattern in `wallet`, `campaign`, etc.)
- **Link target**: `/admin/quests/${quest.id}` — same as Admin → Quests list.
- **Upgrade to CYOA**: Already available on the edit page; no spec change needed.

## Reference

- Quest Detail Modal: [src/components/QuestDetailModal.tsx](../../src/components/QuestDetailModal.tsx)
- Quest Thread: [src/components/QuestThread.tsx](../../src/components/QuestThread.tsx)
- Quest Pack: [src/components/QuestPack.tsx](../../src/components/QuestPack.tsx)
- Home page: [src/app/page.tsx](../../src/app/page.tsx)
- Admin quest edit: [src/app/admin/quests/[id]/page.tsx](../../src/app/admin/quests/[id]/page.tsx)
- Quest Upgrade to CYOA: [.specify/specs/quest-upgrade-to-cyoa/spec.md](../quest-upgrade-to-cyoa/spec.md)
