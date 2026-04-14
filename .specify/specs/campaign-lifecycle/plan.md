# Plan: Campaign Lifecycle

## Overview

Implement the campaign lifecycle system in four phases: state machine + clock types, milestone interview, composting protocol, and clock-gated content. Each phase is independently shippable and builds on the previous.

## Phase 1 — Campaign State Machine + Clock Types

**Goal**: Campaigns have formal states (DRAFT → ACTIVE → COMPOSTING/COMPLETED/RETIRED) and clock types that govern pacing.

### Steps

1. **Schema migration**: Add lifecycle fields to campaign instance model (`state`, `clockType`, `clockGated`, `deadline`, `clockStartedAt`, `kotterStage`, `bigVision`, `desiredFeeling`, `compostedAt`, `parentCampaignRef`, `parentSpokeIndex`)
2. **Campaign lifecycle actions**: Implement `createCampaign`, `activateCampaign`, `getCampaignMaturity` server actions
3. **Kotter advancement — time-bounded**: Implement deterministic stage calculation from `clockStartedAt + deadline` (no cron needed — compute on access)
4. **Kotter advancement — completion-bounded**: Implement threshold check against collective BAR maturity per stage. Define thresholds per stage (configurable per campaign)
5. **State transition guards**: Ensure transitions are valid (can't activate without milestones, can't compost a DRAFT, etc.)
6. **Tests**: State machine transitions, clock type pacing calculations, Kotter advancement logic

### Key Decisions
- Kotter stage for time-bounded campaigns is computed deterministically: `Math.min(8, Math.floor((now - clockStartedAt) / (deadline - clockStartedAt) * 8) + 1)`
- No cron jobs. All clock checks are on-access computations from stored timestamps.
- Completion-bounded thresholds are stored as campaign config, not hardcoded.

### Files
- `prisma/schema.prisma` — model changes
- `src/actions/campaign-lifecycle.ts` — new server actions
- `src/lib/campaign/lifecycle.ts` — state machine logic + Kotter calculations
- `src/lib/campaign/types.ts` — extend with lifecycle types

## Phase 2 — Milestone Interview + Generation

**Goal**: Campaign creators define milestones through a two-question interview that decomposes their vision into actionable steps.

### Steps

1. **Interview action**: Implement `setCampaignMilestones` — receives big vision, desired feeling, and milestone array. Validates milestone-spoke binding. Runs sustainability check (flags milestones that conflict with desired feeling).
2. **Milestone schema**: Add `CampaignMilestone` model with spoke binding, target metric, and progress tracking
3. **Vision quest emission**: Implement `emitVisionQuest` — when creator can't articulate vision, emit a Wake Up BAR seed. Campaign stays DRAFT.
4. **Milestone progress tracking**: Implement `updateMilestoneProgress` — called when BARs mature in spoke nursery beds. Updates `currentValue` and `met` flag.
5. **Milestone-to-maturity bridge**: Define how milestone completion contributes to Kotter advancement for completion-bounded campaigns
6. **Tests**: Milestone CRUD, sustainability flag detection, vision quest emission, progress updates

### Key Decisions
- Sustainability check is rule-based, not AI: compare milestone descriptions against desired feeling keywords. Flag contradictions (e.g., desired feeling = "peaceful" + milestone = "organize 10 events in 2 weeks").
- Vision quest is a standard BAR with `questType: 'vision-development'` and `campaignRef` pointing to the DRAFT campaign.
- Milestone progress is updated on BAR plant/maturation events, not polled.

### Files
- `prisma/schema.prisma` — CampaignMilestone model
- `src/actions/campaign-lifecycle.ts` — extend with milestone actions
- `src/lib/campaign/milestone-interview.ts` — decomposition + sustainability logic
- `src/lib/campaign/milestone-progress.ts` — progress tracking

## Phase 3 — Composting Protocol

**Goal**: When campaigns end, owners have agency. BARs persist. Spokes can spin off. Learnings publish.

### Steps

1. **Composting trigger**: Implement `compostCampaign` — transitions ACTIVE → COMPOSTING. For time-bounded campaigns, auto-triggered when clock expires (checked on access). For all campaigns, manually triggerable by owner.
2. **Composting options resolver**: Implement `getCompostingOptions` — analyzes campaign state to determine what's available (which spokes have enough material, which are sub-hubs, whether there's enough for library publication)
3. **Spoke spin-off**: Implement spoke → new campaign creation. Preserves BAR material, player assignments, and spoke configuration. New campaign starts in ACTIVE state with its own lifecycle.
4. **Library publish**: Implement `publishToLibrary` — serializes campaign template (milestones, spoke structure, clock config) + owner reflection into LibraryEntry. Immutable once published.
5. **Library browse + instantiate**: Implement `browseLibrary` and `instantiateFromTemplate` — browse published entries, create new DRAFT campaign pre-populated from template.
6. **Reflection mini-campaign**: Implement optional reflection campaign creation — small, completion-bounded campaign with a single spoke for processing learnings.
7. **Tests**: Composting flow end-to-end, spoke spin-off preserves data, library publish + instantiate round-trip

### Key Decisions
- BAR ownership is always player-scoped. Composting never touches BARs. Players keep everything.
- Spoke spin-off creates a new campaign instance, not a fork. The new campaign has its own lifecycle starting from ACTIVE.
- Library entries are immutable. If the owner wants to update learnings, they publish a new entry (versioned).
- "Walk away" is the default. All other options require explicit owner action.

### Files
- `prisma/schema.prisma` — LibraryEntry model
- `src/actions/campaign-lifecycle.ts` — composting + library actions
- `src/lib/campaign/composting.ts` — composting logic + options resolver
- `src/lib/campaign/library.ts` — publish + browse + instantiate

## Phase 4 — Clock-Gated Content

**Goal**: Time-bounded campaigns can optionally gate spoke/content access on a fixed schedule.

### Steps

1. **Clock-gate calculation**: Implement spoke unlock schedule from `clockStartedAt + deadline`. Each spoke unlocks at `clockStartedAt + (spokeIndex * deadline / 8)`.
2. **Locked spoke rendering**: Implement locked spoke visibility — spoke is visible in hub but shows countdown timer and is inaccessible.
3. **Unlock notification**: When a spoke unlocks, players in the campaign receive a notification (via existing notification system or in-hub indicator).
4. **Tests**: Unlock schedule calculation, locked spoke gate, unlock transitions

### Key Decisions
- Clock-gating is an overlay on time-bounded campaigns, toggled via `clockGated: boolean`.
- Unlock times are deterministic from stored config. No cron needed.
- Spoke ordering still follows hexagram cast — clock-gating governs when spokes become accessible, not their spatial order.

### Files
- `src/lib/campaign/clock-gate.ts` — unlock schedule logic
- `src/components/campaign-hub/LockedSpokePortal.tsx` — locked spoke UI
- Extend hub rendering to check gate status before allowing spoke entry

## Verification

After each phase:
- `npm run build` — full Next.js build passes
- `npm run check` — lint + type-check clean
- State transitions are tested with unit tests
- Clock calculations are tested with deterministic time inputs

## Risk Notes

- **Existing BB campaign data**: Phase 1 migration must handle existing campaign instances gracefully — default `state: 'ACTIVE'`, `clockType: 'time-bounded'`, `kotterStage: 1`.
- **Kotter threshold tuning**: Completion-bounded Kotter thresholds will need playtesting. Start with generous thresholds and tighten based on feedback.
- **Library moderation**: Phase 3 library is unmoderated. Future work may need content review before publication.
