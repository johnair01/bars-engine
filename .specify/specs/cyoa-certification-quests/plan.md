# Plan: CYOA Onboarding Certification Test Quests

## Goal
Add a certification quest that verifies the CYOA onboarding features. The quest appears on the Adventures page with the "Certification" badge; completing it grants vibeulons and confirms the feature flow.

## Implementation

### 1. Twine story content (inline in seed script)
Single story with passages:
- **START**: Intro — this quest verifies CYOA onboarding: landing CTA, campaign, sign-up redirect, first quest.
- **STEP_1**: Verify landing: open homepage (logged out), confirm "Begin the Journey" is the primary CTA linking to /campaign.
- **STEP_2**: Verify campaign: go to /campaign, play through until the sign-up node (Claim Your Destiny).
- **STEP_3**: Verify redirect: after sign-up, confirm redirect to /conclave/onboarding (or first orientation quest).
- **STEP_4**: Verify first quest: confirm orientation thread and first quest are visible (Enter Ritual / Start Journey).
- **END_SUCCESS**: Verification complete; no links — player completes quest and receives reward.

Passage format: `name`, `text`, `cleanText`, `links: [{ label, target }]`. `parsedJson`: `{ title, startPassage: 'START', passages }`.

### 2. Seed script
- **File**: `scripts/seed-cyoa-certification-quests.ts`
- Load creator (first player or admin). Upsert TwineStory (slug: `cert-cyoa-onboarding-v1`, title, parsedJson, isPublished: true). Upsert CustomBar (id: `cert-cyoa-onboarding-v1`, title, description, reward: 1, twineStoryId, status: 'active', visibility: 'public', isSystem: true). Idempotent.

### 3. npm script
- Add `"seed:cert:cyoa": "tsx scripts/seed-cyoa-certification-quests.ts"` to package.json.

### 4. Documentation
- Add "Certification quest verification" section to `.specify/specs/cyoa-onboarding-reveal/testing.md`: run `npm run seed:cert:cyoa`, open Adventures, find the CYOA certification quest, play through and complete; confirm vibeulon reward and that each step matches the feature.

## Verification
- After seeding, log in, go to Adventures, see the new quest with "Certification" badge.
- Play through the Twine story, complete the quest, confirm vibeulon reward.
- Use the quest steps to confirm: landing CTA, campaign → sign-up → onboarding redirect, first quest visible.
