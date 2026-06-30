# Tasks: The Crossing Campaign Landing Page

## Phase 1: Spec Kit

- [x] Create `spec.md`.
- [x] Create `plan.md`.
- [x] Create `tasks.md`.

## Phase 2: Role Definitions

- [x] Create `src/lib/the-crossing-support-moves.ts`.
- [x] Define campaign constants for `the-crossing` and `mtgoa-barn-raising`.
- [x] Define six support roles.
- [x] Export helper to validate role ids.

## Phase 3: Landing Page

- [x] Add The Crossing static fallback campaign data.
- [x] Ensure `/campaign/the-crossing` renders without an approved DB campaign record.
- [x] Add parent link to `/campaign/mtgoa-barn-raising`.
- [x] Add support role section only for The Crossing.
- [x] Preserve existing behavior for all other campaign pages.

## Phase 4: BAR Capture

- [x] Add `src/actions/the-crossing-support.ts`.
- [x] Resolve steward player id.
- [x] Validate submitted role.
- [x] Create `CustomBar` with `campaignRef: "the-crossing"`.
- [x] Store `parentCampaignRef: "mtgoa-barn-raising"` and `campaignLineage`.
- [x] Redirect to success state.

## Phase 5: Verification

- [x] Run targeted static checks.
- [x] Run Library index after spec changes.
- [x] Confirm changed files.
- [x] Verify `/campaign/the-crossing` renders in the browser.
- [x] Verify mobile layout has no horizontal overflow at 390px.

## Phase 6: Design Handoff

- [x] Capture choose-your-own-adventure design direction.
- [x] Capture story page requirement.
- [x] Capture "How To Play" replacement for "How to Contribute."
- [x] Capture role/path-card interaction model.
- [x] Capture dedicated role detail page requirements.
- [x] Capture Allyship Deck move integration.
- [x] Capture Superpower Quiz and BARS Engine signup pathways.
- [x] Capture Donor/Venmo requirement.
- [x] Capture open questions for Wendell.
