# Spec: Certification Quest — Onboarding Quest Generation Unblock

## Purpose

Add a verification quest (`cert-onboarding-quest-generation-unblock-v1`) that validates the onboarding quest generation flow: I Ching draw, feedback-driven regeneration, skeleton-first, structural validity, and publish. Testers walk through the CYOA-style GenerationFlow and confirm each unblock feature works.

**Problem**: The onboarding-quest-generation-unblock spec (Phases 1–4) is implemented but lacks a certification quest to validate it systematically.

**Practice**: Deftness Development — spec kit first; verification quest required for UX features.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Quest ID | `cert-onboarding-quest-generation-unblock-v1` |
| Seed script | Add to existing `scripts/seed-cyoa-certification-quests.ts` |
| Narrative | Frame toward Bruised Banana Fundraiser: validate quest generation so Campaign Owners can create onboarding quests for the party |
| Passage links | Use markdown link syntax per [cert-quest-passage-links](../cert-quest-passage-links/spec.md) |

## Conceptual Model

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Tester (admin), Campaign Owner |
| **WHAT** | Certification quest — Twine story + CustomBar |
| **WHERE** | Admin Quest Grammar (`/admin/quest-grammar`), CYOA tab |
| **Energy** | Vibeulons — minted on quest completion |
| **Personal throughput** | Verify I Ching → skeleton → feedback → flavor → publish |

## User Stories

### P1: Verification quest for unblock flow

**As a tester**, I want a certification quest that walks me through the onboarding quest generation unblock flow (I Ching, feedback, skeleton, publish), so I can validate the feature without ad-hoc steps.

**Acceptance**: Quest has 6 steps; each step links to the next; FEEDBACK passage for Report Issue; completing END_SUCCESS mints reward.

### P2: Bruised Banana alignment

**As a tester**, I want the quest narrative to tie to the Bruised Banana Fundraiser, so the verification advances campaign preparation.

**Acceptance**: Intro and step copy mention preparing onboarding quests for the party or residency.

## Functional Requirements

### FR1: Twine story

- Twine story with passages: START, STEP_1–STEP_6, FEEDBACK, END_SUCCESS.
- Each step = one verification action; links advance; final passage has no link.

### FR2: Step coverage

- **STEP_1**: Open [admin quest grammar](/admin/quest-grammar); switch to CYOA tab.
- **STEP_2**: Complete unpacking Q1–Q7; reach I Ching step; cast or select hexagram.
- **STEP_3**: Reach Generate step; click Generate Skeleton or Generate with AI.
- **STEP_4**: Give feedback in the feedback field; click Regenerate; confirm output updates.
- **STEP_5**: Confirm output is structurally valid (nodes, choices, reachable completion).
- **STEP_6**: Publish to Campaign (or Export .twee).

### FR3: Quest record

- CustomBar with `id: 'cert-onboarding-quest-generation-unblock-v1'`, `isSystem: true`, `visibility: 'public'`, `reward: 1`.
- `backlogPromptPath: '.specify/specs/onboarding-quest-generation-unblock/spec.md'`.

### FR4: Seed script

- Idempotent upsert in `scripts/seed-cyoa-certification-quests.ts`.
- Add to `CERT_QUEST_IDS` array.

## Non-Functional Requirements

- Reuse existing Twine/Prisma patterns; no schema changes.
- Passages use markdown links for URLs (e.g. `[admin quest grammar](/admin/quest-grammar)`).
- FEEDBACK passage with Report Issue; no link out (tags: `['feedback']`).

## Verification Quest (meta)

- **ID**: `cert-onboarding-quest-generation-unblock-v1` (the quest we are creating)
- **Steps**: See FR2.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/spec.md)

## Dependencies

- [onboarding-quest-generation-unblock](../onboarding-quest-generation-unblock/spec.md) — feature being verified
- [cyoa-certification-quests](../cyoa-certification-quests/spec.md) — certification pattern
- [cert-quest-passage-links](../cert-quest-passage-links/spec.md) — markdown links in passages

## References

- [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts)
- [src/app/admin/quest-grammar/GenerationFlow.tsx](../../src/app/admin/quest-grammar/GenerationFlow.tsx)
