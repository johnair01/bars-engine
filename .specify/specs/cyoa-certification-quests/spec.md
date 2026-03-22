# Specification: CYOA Onboarding Certification Quests

## Purpose
Certification quests that verify the CYOA onboarding features: landing CTA, campaign flow, sign-up redirect to onboarding, and first orientation quest. Each quest is a Twine story linked to a CustomBar with `isSystem: true` and a vibeulon reward. Completing the quest both validates the feature and grants vibeulons.

## Target audience
Testers and admins verifying the CYOA onboarding reveal and quest handoff.

## User stories
1. **As a tester**, I want a certification quest that walks me through verifying "Begin the Journey" on the landing, playing to the campaign sign-up node, and confirming redirect to `/conclave/onboarding` after sign-up, so that I can validate the updated flow without ad-hoc steps.
2. **As a tester**, I want to complete the quest and receive vibeulons so that the test doubles as a real completion.

## Functional requirements
- **FR1 (Twine story)**: One or more Twine stories with step-by-step verification instructions. Each passage is one verification step; links advance; final passage has no link so the player can complete the quest in the Twine player and receive the reward.
- **FR2 (Quest record)**: Each story is linked to a CustomBar with `isSystem: true`, `visibility: 'public'`, `reward` (e.g. 1 or 2), and a deterministic id (e.g. `cert-cyoa-onboarding-v1`).
- **FR3 (Seed script)**: Idempotent seed script that creates/updates TwineStory and CustomBar so the quest appears on the Adventures page with the "Certification" badge.
- **FR4 (Vibeulons)**: Quest completion is handled by the existing quest engine; completing the Twine story mints the quest reward to the player.

## Non-functional requirements
- Reuse existing Twine/Prisma patterns; no schema changes.
- Seed script safe to run multiple times (upsert by slug / id).

## Reference

- Tasks / verification: [tasks.md](./tasks.md)
- Certification badge: [src/app/adventures/page.tsx](src/app/adventures/page.tsx) — quests with `isSystem: true` show "Certification".
- Twine shape: [src/lib/schemas.ts](src/lib/schemas.ts) ParsedTwineSchema / CanonicalTwineStory.
- Seed: [scripts/seed-cyoa-certification-quests.ts](scripts/seed-cyoa-certification-quests.ts) — `npm run seed:cert:cyoa`
- Existing pattern: [scripts/seed-validation-quest.ts](scripts/seed-validation-quest.ts), [scripts/seed-admin-tests.ts](scripts/seed-admin-tests.ts).
