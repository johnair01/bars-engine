# Spec: Go-Live Integration

## Purpose

Prepare the Bruised Banana Residency app for launch by formalizing the go-live checklist, adding a verification quest that walks through pre-launch checks, and documenting required seed scripts. Ensures the launch team can confidently run the loop readiness flow and verify the core game loop before sending invitations.

**Broader vision**: Go-live as a repeatable gate—run before each major release or campaign launch.

## Conceptual Model (Game Language)

- **WHAT**: The core game loop (sign in → complete quest → mint vibeulons → see wallet → repeat).
- **Energy**: Vibeulons must mint correctly on quest completion.
- **Personal throughput**: Launch team runs verification before Show Up (sending invitations).

## User Stories

### P1: Run loop readiness before launch
**As a launch admin**, I want to run `npm run loop:ready` (or equivalent) and get a clear GO/NO-GO result, so I know the core loop is healthy before launch.

**Acceptance**: `npm run loop:ready` runs build, reset-history, core quest config check, feedback-cap test, feedback-cap history. Prints summary table. Exits 1 on any FAIL. Exits 0 with "GO" message when all pass.

### P2: Verification quest for go-live
**As a launch admin**, I want a certification quest that walks through the go-live checklist steps, so I can verify the flow manually and document completion.

**Acceptance**: Verification quest `cert-go-live-v1` seeded by `npm run seed:cert:cyoa`. Steps: (1) Run loop:ready or confirm build + feedback-cap pass, (2) Sign in as admin, (3) Complete a quest and confirm vibeulon mints, (4) Confirm wallet reflects balance. Final passage: no link; completing mints reward. Narrative: preparing the Bruised Banana Fundraiser for launch.

### P3: Pre-launch seed documentation
**As a launch admin**, I want a clear list of seed scripts to run before launch, so I don't miss required data.

**Acceptance**: Document in `docs/LOOP_READINESS_CHECKLIST.md` or new `docs/GO_LIVE.md`: required seeds (seed:party, seed:quest-map, seed:cert:cyoa, seed:onboarding), order, and when to run each. Link from checklist.

### P4: Checklist alignment with loop:ready
**As a launch admin**, I want the manual checklist to align with what loop:ready automates, so I understand what's covered and what remains manual.

**Acceptance**: `docs/LOOP_READINESS_CHECKLIST.md` references `npm run loop:ready` as the automated portion. Manual smoke section (auth, intention, feedback quest, wallet) remains for human verification. Go/No-Go gate lists both automated and manual criteria.

## Functional Requirements

- **FR1**: `npm run loop:ready` MUST run: build (unless --quick), db:reset-history, core quest config verification, test:feedback-cap, db:feedback-cap-history. Print summary; exit 1 on FAIL.
- **FR2**: Verification quest `cert-go-live-v1` MUST be seeded by `npm run seed:cert:cyoa`. Twine story with passages for: run loop:ready, sign in, complete quest + confirm mint, confirm wallet. Final passage has no link.
- **FR3**: Pre-launch seed documentation MUST exist (in LOOP_READINESS_CHECKLIST.md or GO_LIVE.md). MUST list: seed:party, seed:quest-map, seed:cert:cyoa, seed:onboarding. MUST state order and purpose.
- **FR4**: LOOP_READINESS_CHECKLIST.md MUST reference loop:ready as the automated portion and clarify manual smoke steps.

## Non-functional Requirements

- loop:ready already exists; verify it covers the checklist. Add any missing checks if needed.
- No schema changes.
- Dev switchers and dev-only UI are already hidden in production (NODE_ENV check).

## Out of Scope (This Spec)

- Hiding /docs or /wiki (player-facing; keep visible).
- Automated deployment gates (CI/CD).
- Instance-specific go-live (single Bruised Banana instance assumed).

## Reference

- Loop readiness: [docs/LOOP_READINESS_CHECKLIST.md](../../docs/LOOP_READINESS_CHECKLIST.md)
- loop:ready script: [scripts/loop-readiness.ts](../../scripts/loop-readiness.ts)
- Certification quests: [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts)
