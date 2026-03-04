# Spec: Admin Validation Suite (Twine)

## Purpose

Provide an automated quality gate that validates the admin Twine quest pipeline: seed admin test quests, play through Quick Mint, verify vibeulon minting and graveyard transition. Run via `npm run test:admin-validation`.

## Context

- [admin-validation-quests](../admin-validation-quests/spec.md) defines 3 test quests (Quick Mint, Labyrinth, Resurrection Loop)
- [admin-certification-suite](../admin-certification-suite/spec.md) defines Market/Graveyard lifecycle
- Existing smoke tests: `test:twine`, `test:twine-quest` use fixtures; this suite uses the seeded admin quests

## User Stories

**As a developer**, I want to run `npm run test:admin-validation` so I can verify the admin Twine pipeline (seed → play → complete → mint → graveyard) without manual testing.

**As a CI pipeline**, I want this test to exit 0 on success and 1 on failure so it can gate deployments.

## Functional Requirements

- **FR1**: Script seeds admin validation quests (or verifies they exist) before testing
- **FR2**: Script plays through Quick Mint: assign quest, create run, advance to END_MINT, trigger auto-complete
- **FR3**: Script verifies: PlayerQuest status = completed, VibulonEvent created, Ledger mint recorded
- **FR4**: Script cleans up test data (player, run, assignment) on exit
- **FR5**: `npm run test:admin-validation` runs the script

## Non-Functional Requirements

- Idempotent: safe to run multiple times
- Requires DATABASE_URL (same as other smoke tests)
- No HTTP server required; uses DB + server actions directly

## Reference

- [scripts/seed-admin-tests.ts](../../scripts/seed-admin-tests.ts)
- [src/actions/twine.ts](../../src/actions/twine.ts) — autoCompleteQuestFromTwine
- [content/stories/admin_tests/the-quick-mint.json](../../content/stories/admin_tests/the-quick-mint.json)
