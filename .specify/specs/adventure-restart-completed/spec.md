# Spec: Restart Completed Adventures (Certification Testing)

## Purpose

When an admin (or tester) clicks a completed certification adventure on the Adventures page, they are currently redirected to the Market instead of being able to re-run the adventure. This blocks feature testing (e.g. cert-quest-grammar-v1) and creates confusion. The spec adds a way to restart/replay completed adventures directly from the Adventures page, without requiring a detour through the Market Graveyard.

## Root cause

- **Current behavior**: Completed certification quests on [src/app/adventures/page.tsx](../../src/app/adventures/page.tsx) link to `/bars/available` (Market) with text "Restore in Market to re-run."
- **Problem**: The user expects to continue or re-run the adventure. Redirecting to Market is disorienting; the Graveyard section exists but requires scrolling and extra steps. Admins doing certification testing need to re-run frequently.
- **Existing infrastructure**: `restoreCertificationQuest(questId)` in [src/actions/admin-certification.ts](../../src/actions/admin-certification.ts) already deletes PlayerQuest + TwineRun to allow a clean restart. The Market Graveyard uses this for "Restore" on quest cards.

## User story

**As an admin** testing certification quests (e.g. cert-quest-grammar-v1), I want to restart a completed adventure directly from the Adventures page so I can re-run the flow without navigating to the Market and hunting for the quest in the Graveyard.

**As a tester**, I want to re-run a completed certification adventure to verify fixes or regression-test, without losing context or being pushed to an unrelated page.

## Functional requirements

- **FR1**: For completed certification quests, the Adventures page MUST offer a "Restart" (or "Re-run") action that resets the quest and run, then navigates to the play page. Admins MUST have this. Non-admins MAY have it (optional; can restrict to admin for v1).
- **FR2**: The Adventures card for a completed cert MUST NOT only link to the Market. It MUST either: (a) link to the play page with a "Restart" option when the run is completed, or (b) provide a "Restart" button on the card that restores and navigates to play.
- **FR3**: After restart, the user MUST land on the adventure play page at the start passage (START), ready to play through again.
- **FR4**: The existing `restoreCertificationQuest` action MUST be reused. No duplicate logic.

## Implementation options

### Option A: Restart button on Adventures card (recommended)

- For completed certs: show card with "Restart" button instead of linking to Market.
- On click: call `restoreCertificationQuest(questId)`, then `router.push(/adventures/${storyId}/play?questId=${questId})`.
- Keeps UX on Adventures page; no extra navigation.

### Option B: Link to play page + Restart when completed

- For completed certs: link to play page (same as incomplete).
- Play page: when run is completed (or quest status completed), show "You've completed this. Restart to run again?" with Restart button.
- Requires play page to handle "completed run" state and offer restart.

### Option C: Remove Market redirect; add Restart for admins only

- For admins: completed certs link to play page; card has "Restart" button.
- For non-admins: keep current behavior (link to Market) or add Restart for parity.

## Non-functional requirements

- Minimal change; reuse `restoreCertificationQuest`.
- Admin-only for v1 is acceptable; extend to all users later if desired.
- No schema changes.

## Reference

- Adventures page: [src/app/adventures/page.tsx](../../src/app/adventures/page.tsx)
- restoreCertificationQuest: [src/actions/admin-certification.ts](../../src/actions/admin-certification.ts)
- Market Graveyard: [src/app/bars/available/page.tsx](../../src/app/bars/available/page.tsx) (graveyardQuests, onRestore)
- Admin Certification Suite: [.specify/specs/admin-certification-suite/spec.md](../admin-certification-suite/spec.md)
