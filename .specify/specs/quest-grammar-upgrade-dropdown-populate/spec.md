# Spec: Quest Grammar Upgrade Dropdown Populate

## Purpose

Ensure the "Start from existing quest" dropdown in Admin / Quest Grammar populates with available quests and surfaces loading/error states so admins can reliably upgrade quests to CYOA.

**Problem**: The dropdown does not populate with available quests. Errors (auth failure, DB load failure) are silently swallowed; the UI shows an empty dropdown with no feedback. Users cannot distinguish loading from empty from failed.

**Practice**: Deftness Development — API-first, return shape with error instead of throwing; loading + error UX in component.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Error handling | Server action returns `{ success, quests?, error? }` instead of throwing; UI never sees uncaught exceptions |
| Filtering | Only upgradeable quests: CustomBar where type in ['quest','vibe'], status 'active' |
| Loading state | Show "Loading…" in dropdown placeholder while fetching |
| Empty state | When no error and no quests: "No quests available. Create a quest first." with link to Admin → Quests |

## Conceptual Model

| WHO | Admin (campaign owner, quest designer) |
| WHAT | Quest dropdown for Upgrade to CYOA flow |
| WHERE | Admin / Quest Grammar → Upgrade from quest tab |
| Energy | getAdminQuestsForUpgrade → quests or error → dropdown populated or message shown |

## API Contracts (API-First)

### getAdminQuestsForUpgrade

**Input**: None

**Output**:
```ts
| { success: true; quests: Array<{ id: string; title: string; description?: string | null; moveType?: string | null; storyContent?: string | null }> }
| { success: false; error: string }
```

- Never throws for auth or DB errors; returns `{ success: false, error }` instead.
- Filter: `type in ['quest','vibe']`, `status = 'active'`.
- Order: `createdAt desc`; limit 200.

## User Stories

### P1: Dropdown populates

**As an admin**, I want the Upgrade from quest dropdown to show available quests, so I can select one to upgrade to CYOA.

**Acceptance**: Open Upgrade from quest tab → dropdown shows quests (or loading, then quests).

### P2: Errors are visible

**As an admin**, I want to see why the dropdown is empty when something fails (e.g. not authorized, DB error), so I can fix the issue.

**Acceptance**: Auth failure or load failure → error message displayed below dropdown.

### P3: Empty state is clear

**As an admin**, I want to know when there are no quests available (vs loading or failed), so I can create a quest first.

**Acceptance**: No error, no quests → "No quests available. Create a quest first." with link to Admin → Quests.

## Functional Requirements

### Phase 1: Server action

- **FR1**: Create `getAdminQuestsForUpgrade` action. Returns `{ success, quests?, error? }`; never throws.
- **FR2**: Filter to upgradeable quests: type in ['quest','vibe'], status 'active'. Select id, title, description, moveType, storyContent.

### Phase 2: UI

- **FR3**: UpgradeFromQuest calls `getAdminQuestsForUpgrade`; handles success and error branches.
- **FR4**: Show loading state (disabled select, "Loading…" placeholder) while fetching.
- **FR5**: Display error message when fetch fails.
- **FR6**: When quests array is empty and no error, show empty state with link to Admin → Quests.

## Non-Functional Requirements

- Admin-only; reuse existing checkAdmin.
- Limit 200 quests to avoid large payloads.

## Dependencies

- [src/actions/admin.ts](../../../src/actions/admin.ts) — getAdminQuests, checkAdmin
- [src/app/admin/quest-grammar/UpgradeFromQuest.tsx](../../../src/app/admin/quest-grammar/UpgradeFromQuest.tsx)

## References

- [getAdminQuests](src/actions/admin.ts) — original throws on auth
- [getLinkableQuests](src/actions/create-bar.ts) — pattern for filtered quest list
