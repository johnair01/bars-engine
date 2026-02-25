# Implementation Plan: CYOA Onboarding Reveal and Quest Handoff

## Summary
Implementation followed the high-leverage plan. All four priorities were completed.

## Changes

### Priority 1: Surface CYOA on landing
- **File**: `src/app/page.tsx`
- Added primary CTA "Begin the Journey" → `/campaign` (Link component).
- Moved "Sign Up" to secondary (zinc styling); "Log In" unchanged.
- Updated footer copy for discoverability.

### Priority 2: Campaign → onboarding (skip guided)
- **File**: `src/app/campaign/components/CampaignAuthForm.tsx`
  - On success, redirect to `/conclave/onboarding` instead of `/conclave/guided`.
- **File**: `src/app/conclave/guided/page.tsx`
  - In `GuidedStoryLoader`, before parsing story progress: if `player.storyProgress` parses to an object with `campaignBypass === true`, redirect to `/conclave/onboarding`.

### Priority 3: Use campaignState for profile/threads
- **File**: `src/app/campaign/actions/campaign.ts`
  - After assigning orientation threads, parse `campaignState` for:
    - `nationId` or `nation` (by name, case-insensitive lookup).
    - `playbookId` or `playbook` (by name, case-insensitive lookup).
  - If valid nation/playbook found, update player with `nationId` and/or `playbookId`, then call `assignGatedThreads(player.id)`.

### Priority 4: Orientation + first-quest UX
- No code changes. Validated: `scripts/seed-onboarding-thread.ts` is idempotent; dashboard already passes `focusQuest` and shows "Enter Ritual" / "Start Journey" for orientation threads.

## Verification
- Landing: unauthenticated users see "Begin the Journey" first.
- Campaign sign-up → `/conclave/onboarding` → first orientation quest or dashboard with focusQuest.
- Campaign users with `campaignBypass` hitting `/conclave/guided` are redirected to onboarding.
- Campaign state with `nationId`/`nation` and/or `playbookId`/`playbook` prefill player and trigger gated thread assignment.
