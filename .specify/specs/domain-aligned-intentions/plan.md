# Plan: Domain-Aligned Intentions (U)

## Summary

Add predefined intention options (including "Following my curiosity") keyed by allyship domain. Extend the intention quest with a "Choose from options" path. Add "Update my intention" entry point on dashboard. Store updated intention in `player.storyProgress` when changed after orientation.

## Implementation

### 1. Predefined intention options (lib)

**File**: `src/lib/intention-options.ts` (new)

- Export `INTENTION_OPTIONS`: array of `{ text: string, allyshipDomain: string | null }`
- Cross-domain: "Following my curiosity" (allyshipDomain: null)
- Per domain: 1–2 options each for GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING
- Example: `{ text: 'I intend to gather resources that support the residency.', allyshipDomain: 'GATHERING_RESOURCES' }`

### 2. Intention quest: "Choose from options" path

**File**: `src/components/QuestDetailModal.tsx`

- Add third mode: `intentionMode: 'direct' | 'guided' | 'options'`
- When `options`: render grid of predefined options (from `INTENTION_OPTIONS`)
- If `player.campaignDomainPreference` non-empty: show domain-aligned options first, then "Following my curiosity", then others
- If empty: show "Following my curiosity" first, then all domain options
- Clicking an option sets `mergedResponses.intention` and allows Submit
- Pass `player` (or `campaignDomainPreference`) to QuestDetailModal via props

### 3. Dashboard: "Update my intention" entry point

**File**: `src/app/page.tsx`

- Near the "My Intention" display, add "Edit" or "Update intention" link/button
- Opens a modal or navigates to a simple page with the same intention-setting UX (direct write, guided, choose from options)
- On save: update `player.storyProgress` with `{ ...existing, intention: newIntention }`
- Dashboard reads intention: `storyProgress.intention ?? orientationQuest.inputs.intention`

**New component**: `IntentionUpdateModal` or reuse `QuestDetailModal` in a special "intention-only" mode

- Simpler: create `IntentionUpdateModal` that has the three paths (direct, guided, options) and calls `updatePlayerIntention` server action
- Server action: `updatePlayerIntention(intention: string)` → parse storyProgress, merge intention, update Player

### 4. Server action: update intention

**File**: `src/actions/intention.ts` (new)

- `updatePlayerIntention(intention: string)`: get current player, parse storyProgress JSON, set intention, db.player.update

### 5. Dashboard intention display logic

**File**: `src/app/page.tsx`

- Resolve intention: `storyProgress?.intention ?? intentionQuest?.inputs?.intention`
- Pass `campaignDomainPreference` to any intention-setting component (for options ordering)

## Verification

- Intention quest: choose "Following my curiosity" → complete → intention appears on dashboard
- Intention quest: choose domain-aligned option (when preference set) → complete → intention stored
- Dashboard: "Update intention" → change to new option → dashboard shows new intention
- Direct write and guided journey paths still work

## Verification quest (required for UI features)

Per Spec Kit skill: verification quests are **required** for UI features. Implemented `cert-domain-intentions-v1` in `scripts/seed-cyoa-certification-quests.ts`. Walks through: open dashboard → Choose from options → select "Following my curiosity" → confirm on dashboard / Edit flow. Narrative: preparing for the Bruised Banana Fundraiser by clarifying contribution intent. Run `npm run seed:cert:cyoa`.
