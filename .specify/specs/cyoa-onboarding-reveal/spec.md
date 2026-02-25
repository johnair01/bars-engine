# CYOA Onboarding Reveal and Quest Handoff

## Purpose
Make the app discoverable via a choose-your-own-adventure flow and get new users from that flow into quests immediately after sign-in, with campaign choices influencing their starting setup.

## Requirements (Implemented)

### 1. Surface the CYOA as the main reveal (discoverability)
- Unauthenticated landing shows a primary CTA "Begin the Journey" linking to `/campaign`.
- Sign Up and Log In remain as secondary actions.
- Copy updated: "Begin the story to discover your path, or sign up directly. Existing players can log in to continue."

### 2. Send campaign sign-ups straight into quests
- After campaign sign-up, redirect to `/conclave/onboarding` (not `/conclave/guided`).
- Orientation threads are already assigned in `createCampaignPlayer`; onboarding controller sends user to first orientation Twine quest or `/?focusQuest=...`.
- On `/conclave/guided`, if `player.storyProgress.campaignBypass === true`, redirect to `/conclave/onboarding` so existing campaign users skip legacy guided flow.

### 3. Use campaign state to personalize
- In `createCampaignPlayer`, parse `campaignState` for `nationId` / `playbookId` (or `nation` / `playbook` by name).
- When valid, update the new player's `nationId` and/or `playbookId`, then call `assignGatedThreads(player.id)` so gated threads are assigned.

### 4. Orientation and first-quest UX
- Orientation thread and quests are seeded via `scripts/seed-onboarding-thread.ts` (idempotent).
- Dashboard passes `focusQuest` from search params to `QuestThread`; orientation threads show "Enter Ritual" / "Start Journey".
- No structural changes required; existing flow is validated.

## Out of scope (this phase)
- In-app editing of CYOA (campaign from DB, passage editor, i18n) — documented in plan as post–structure setup.
- Optional: Connect campaign path to post-sign-in narrative (Onboarding_Start / Onboarding_QuestPool).
