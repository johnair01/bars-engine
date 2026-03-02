# Spec: K-Space Librarian Post-Onboarding (Basic Quest)

## Purpose

Make K-Space Librarian a **basic quest** available to players after onboarding so they can help improve the app and knowledge base. Players who complete onboarding will see a K-Space Librarian orientation thread that teaches the Request from Library flow and rewards participation.

## Rationale

- **Post-onboarding gap**: The Library infrastructure (LibraryRequestModal, resolveOrSpawn, DocQuest spawning) exists, but players have no guided path to discover it. The "Request from Library" button is in the header but not surfaced as a quest.
- **Basic quest**: K-Space Librarian is one of the foundational quests that helps the collective—turning player confusion into docs and DocQuests. It should be accessible immediately after onboarding.
- **Game language**: WHO (player as requestor), WHAT (Library Request, DocQuest), Energy (vibeulons for completion), Personal throughput (Wake Up: search; Show Up: complete DocQuest).

## User Stories

### P1: Player discovers K-Space Librarian after onboarding

**As a player** who has completed onboarding, I want to see a K-Space Librarian orientation quest in my Journeys, so I know I can help improve the knowledge base.

**Acceptance**: Orientation thread "Help the Knowledge Base" (or "K-Space Librarian") is assigned via `assignOrientationThreads`; appears in Journeys alongside Welcome Journey and Build Your Character.

### P2: Player completes the quest by submitting a Library Request

**As a player**, I want to complete the K-Space Librarian quest by submitting a Library Request and confirming the result (resolved link or spawned DocQuest), so I earn vibeulons and contribute to the collective.

**Acceptance**: Quest has Twine steps: (1) Open dashboard, click Request from Library; (2) Submit a request; (3) If resolved—confirm you got a doc link. If spawned—confirm a DocQuest was created and appears in Active Quests.

### P3: Spawned DocQuest is visible to the requestor

**As a player** whose request spawned a DocQuest, I want that DocQuest to appear in my Active Quests so I can complete it and earn the reward.

**Acceptance**: When `submitLibraryRequest` returns `status: 'spawned'`, a `PlayerQuest` is created with `status: 'assigned'` for the requestor; DocQuest appears in dashboard Active Quests.

### P4: Verification quest (admin)

**As a tester/admin**, I want `cert-k-space-librarian-v1` to verify the full flow including admin pages, so I can validate the feature.

**Acceptance**: Existing cert-k-space-librarian-v1 remains; steps 2–3 (admin/library, admin/docs) are admin-only; player-facing flow is covered by the orientation quest.

## Functional Requirements

- **FR1**: Orientation quest "Help the Knowledge Base" (id: `k-space-librarian-quest`) MUST have a Twine story with player-only steps (no admin steps). Steps: (1) Request from Library; (2) Submit request; (3) Confirm result (resolved link or spawned DocQuest).
- **FR2**: Orientation thread "Help the Knowledge Base" (id: `k-space-librarian-thread`) MUST have `threadType: 'orientation'`, `status: 'active'`, and contain the single quest at position 1.
- **FR3**: `assignOrientationThreads` MUST assign the K-Space Librarian thread (no code change; thread is fetched with other orientation threads).
- **FR4**: When `submitLibraryRequest` returns `status: 'spawned'`, the system MUST create a `PlayerQuest` for the requestor with `questId: docQuest.id`, `status: 'assigned'`.
- **FR5**: Quest MUST have `isSystem: true`, `visibility: 'public'`, `reward: 1`, and be seeded idempotently.

## Non-functional Requirements

- No schema changes beyond existing LibraryRequest, DocNode, CustomBar, PlayerQuest.
- Seed script idempotent (upsert by id/slug).
- LibraryRequestModal link for spawned case: dashboard or `/` (DocQuest will appear in Active Quests after auto-assign).

## Dependencies

- [k-space-librarian](../k-space-librarian/spec.md) — Library infrastructure (LibraryRequest, DocNode, resolveOrSpawn, LibraryRequestModal) must exist.
- Orientation threads: [src/actions/quest-thread.ts](../../src/actions/quest-thread.ts)
- Seed pattern: [scripts/seed-onboarding-thread.ts](../../scripts/seed-onboarding-thread.ts)

## Out of Scope (v1)

- DocQuest completion flow (evidence submission, DocEvidenceLink) — Phase 2 of base K-Space Librarian.
- RST/Sphinx export.
- Market visibility for system quests (orientation thread surfaces the quest).
