# Plan: Dashboard UI Vibe Cleanup

## Summary

Phased cleanup of dashboard and related UI: remove/hide unused features, fix copy, add guiding quests, simplify active quest display.

## Phase 1: Quick Wins (Remove/Hide)

### 1.1 Recent Vibeulon Activity
- **File**: [src/app/page.tsx](src/app/page.tsx)
- Remove `<MovementFeed items={movementFeedItems} maxHeight="10rem" />` from player dashboard (line ~434).
- Optionally: add to admin-only section or /admin/tools.

### 1.2 Attunement Button
- **File**: [src/app/page.tsx](src/app/page.tsx)
- Remove `<AttuneButton instanceId={activeInstance.id} maxAmount={vibulons} />` from Live Instance banner (line ~505).

### 1.3 Sponsor → Donate
- **File**: [src/app/page.tsx](src/app/page.tsx) — change "Sponsor" to "Donate" (line ~502).
- **Files**: [src/app/event/page.tsx](src/app/event/page.tsx), [src/app/api/adventures/.../route.ts](src/app/api/adventures/[slug]/[nodeId]/route.ts), [src/app/admin/instances/page.tsx](src/app/admin/instances/page.tsx) — update DEFAULT_SHOW_UP / placeholder text if it says "Sponsor".

### 1.4 BARs Wallet Section
- **File**: [src/app/page.tsx](src/app/page.tsx)
- Remove the "Bars Wallet" section (lines ~620–642) that shows when `visibleCustomBars.some(b => b.type === 'inspiration')`.

### 1.5 Create BAR Buttons
- **File**: [src/app/page.tsx](src/app/page.tsx)
- In CREATE ACTIONS grid (lines ~676–711): keep only the 📜 "Create BAR" link; remove "Create Quest" (✨), "Quick Quest" (+), and the second "Create a BAR" link.
- Update kept button: remove "Use a template" if present; use "Share an insight or story" or similar.

### 1.6 Special Moves & Elemental Moves
- **File**: [src/app/page.tsx](src/app/page.tsx)
- Remove "Special Moves" block (lines ~768–778).
- Remove "Elemental Moves" block (lines ~780–801).

### 1.7 Wake Up / Clean Up / Grow Up / Show Up Buttons
- **File**: [src/app/page.tsx](src/app/page.tsx)
- Remove the "Basic Moves Grid" with AlchemyCaster for Wake Up, Clean Up, Grow Up, Show Up (lines ~743–765).
- Keep Emotional First Aid link (Medbay Access).

## Phase 2: Orientation & Thread Changes

### 2.1 Welcome to Conclave
- **File**: [scripts/seed-onboarding-thread.ts](scripts/seed-onboarding-thread.ts) or [src/actions/quest-thread.ts](src/actions/quest-thread.ts)
- Stop assigning "Welcome to the Conclave" / "Welcome Journey" thread (or archive it).
- **File**: [src/app/conclave/onboarding/page.tsx](src/app/conclave/onboarding/page.tsx)
- Fix: when player has nationId + playbookId (and optionally avatarConfig), skip or redirect away from onboarding instead of showing welcome.

### 2.2 Build Your Character
- **File**: [src/actions/quest-thread.ts](src/actions/quest-thread.ts) or [src/app/page.tsx](src/app/page.tsx)
- Filter out `build-character-thread` from threads shown to players; keep in admin onboarding page.

### 2.3 Rookie Essentials
- **File**: [scripts/seed-world-content.ts](scripts/seed-world-content.ts)
- Remove or comment out "Rookie Essentials" pack creation.
- **File**: [src/actions/quest-pack.ts](src/actions/quest-pack.ts) or wherever packs are fetched — ensure Rookie Essentials is not assigned if it remains in DB.

## Phase 3: Active Quests UX

### 3.1 Default Closed
- **File**: [src/components/StarterQuestBoard.tsx](src/components/StarterQuestBoard.tsx) or [src/components/QuestThread.tsx](src/components/QuestThread.tsx)
- VibeBarCard: change `useState(isActive)` to `useState(false)` so active quests start closed.
- Or: pass `defaultOpen={false}` for active quests.

### 3.2 Remove Vision / Approach / Kotter from Modal
- **File**: [src/components/QuestDetailModal.tsx](src/components/QuestDetailModal.tsx)
- Quest inputs come from `quest.inputs` (JSON). Filter out or hide inputs with keys `vision`, `approach`, `kotterStage` when rendering for active quest completion.
- **File**: [src/lib/quest-templates.ts](src/lib/quest-templates.ts) — optional: remove these from default templates for new quests.

### 3.3 Quest Wallet Link (>5 active)
- **File**: [src/app/page.tsx](src/app/page.tsx)
- When `activeBars.length > 5`, show a "View Quest Wallet" or "Organize quests" link above/below Active Quests.
- **New**: Create `/quest-wallet` or `/hand` page as the quest wallet interface (or reuse /hand).

## Phase 4: New Quests & Copy

### 4.1 Request from Library Quest
- Create orientation quest (or extend K-Space Librarian) with copy: librarians interested in making info readily available.
- **File**: [src/actions/library.ts](src/actions/library.ts) — in `submitLibraryRequest`, when spawning DocQuest: create PlayerQuest for requestor; optionally complete a wake-up-at-stage-1 quest for the DocQuest (clarify: "auto-complete a wake up quest at stage 1 urgency for the DocQuest" — may mean set DocQuest kotterStage to 1 and/or complete a related wake-up quest).

### 4.2 BARs Wallet Guide Quest
- Create quest that guides players to /bars (BARs wallet page).

### 4.3 Emotional First Aid Quest Thread
- Create orientation thread with quest(s) teaching Emotional First Aid usage.
- **File**: Emotional First Aid — ensure admin can edit (check [src/app/admin/](src/app/admin/) or emotional-first-aid config).

### 4.4 Four Moves Orientation Quests
- Create orientation quests that explain Wake Up, Clean Up, Grow Up, Show Up and how they interface with quests.

## File Impacts

| Action | Path |
|--------|------|
| Modify | src/app/page.tsx (MovementFeed, AttuneButton, Sponsor, BARs Wallet, Create buttons, Moves sections) |
| Modify | src/components/StarterQuestBoard.tsx (default closed) |
| Modify | src/components/QuestDetailModal.tsx (hide vision/approach/kotter) |
| Modify | src/app/conclave/onboarding/page.tsx (admin redirect) |
| Modify | src/actions/quest-thread.ts (filter Welcome/Build Char) |
| Modify | scripts/seed-world-content.ts (Rookie Essentials) |
| Modify | src/actions/library.ts (DocQuest wake-up completion) |
| Create | Orientation quests (Library, BARs, EFA, Four Moves) |
