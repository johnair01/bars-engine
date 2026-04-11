# Plan: Milestone Sustainability Support

## Overview

Implement sustainability supports in five phases: drain detection, support models, partner confirmation, nudges, and UI. Each phase ships independently and builds on the campaign-lifecycle spec.

## Phase 1 — Drain Detection

**Goal**: System can analyze a milestone description and identify drain types with reasoning.

### Steps

1. **Drain type definitions**: Encode the five drain types with their indicators (keywords, patterns, descriptions)
2. **Detection logic**: Implement keyword-based heuristics in `src/lib/campaign/sustainability/drain-detection.ts`
3. **Reasoning generation**: Each detected drain type produces a human-readable reasoning string
4. **Drain → support mapping**: Static mapping from drain type to recommended support types
5. **Server actions**: Implement `analyzeMilestoneSustainability` and `analyzeCampaignSustainability`
6. **Tests**: Detection on known milestone descriptions, reasoning quality, mapping completeness

### Key Decisions
- Detection is rule-based, not AI-based. Determinism > sophistication.
- Keywords are configurable per drain type. Easy to tune.
- A milestone can have multiple drain types — they're additive, not exclusive.
- Severity is derived from how many drain indicators match (mild = 1, moderate = 2, high = 3+).

### Files
- `src/lib/campaign/sustainability/drain-types.ts` — type definitions + indicators
- `src/lib/campaign/sustainability/drain-detection.ts` — detection logic
- `src/lib/campaign/sustainability/drain-support-mapping.ts` — drain → support mapping
- `src/actions/milestone-sustainability.ts` — server actions

## Phase 2 — Support Structure Models

**Goal**: Owners can create, attach, and manage concrete support structures.

### Steps

1. **Schema migration**: Add `SupportStructure` and `MilestoneSupportAttachment` models. Extend `CampaignMilestone` with sustainability fields.
2. **Type-aware validation**: Each support type requires specific fields. Validation enforces this on creation.
3. **CRUD actions**: Implement `createSupportStructure`, `attachSupportToMilestone`, `declineSupportForMilestone`, `markSupportInPlace`
4. **Query actions**: Implement `getMilestoneSupports`, `getPlayerSupportLibrary`
5. **Composting persistence**: Verify supports survive campaign composting (campaign deletion does not cascade to supports)
6. **Tests**: CRUD operations, validation by type, composting persistence

### Key Decisions
- Supports belong to the player/owner, not the campaign. They survive campaign lifecycle events.
- Type-specific field validation is centralized to allow new types to be added easily.
- A support can be attached to multiple milestones — supporting reuse.

### Files
- `prisma/schema.prisma` — model changes
- `src/lib/campaign/sustainability/support-types.ts` — type definitions + per-type validators
- `src/lib/campaign/sustainability/support-crud.ts` — CRUD logic
- `src/actions/milestone-sustainability.ts` — extend with support actions

## Phase 3 — Partner Confirmation Flow

**Goal**: Relational supports (with named partners) require partner confirmation before transitioning to in-place.

### Steps

1. **Partner notification**: When a relational support is created with `partnerId`, notify the partner via existing notification system
2. **Partner confirmation action**: Partner can confirm or decline the request
3. **State transitions**: Partner confirmation transitions support to `in-place`. Decline keeps it `pending` and notifies owner.
4. **External partners**: For supports with `partnerName` only (no system account), owner can manually mark in-place after confirming externally
5. **Tests**: Notification delivery, confirmation flow, decline handling, external partner flow

### Key Decisions
- External partners (people not in the system) are tracked by name only. Owner manages their state manually.
- Internal partners (players in the system) have a structured confirmation flow.
- Decline preserves the support in pending state — owner can reattempt or replace.

### Files
- `src/lib/campaign/sustainability/partner-confirmation.ts`
- `src/actions/milestone-sustainability.ts` — partner actions

## Phase 4 — Nudge System

**Goal**: When work begins on a milestone with pending or missing supports, the system surfaces a gentle nudge.

### Steps

1. **Readiness check**: Implement `checkMilestoneSupportReadiness` — analyzes milestone's attached supports and returns gaps
2. **Nudge message generator**: Maps drain type + missing support → human-readable nudge text
3. **Integration points**: Hook into milestone work entry points (BAR planting, quest start, manual milestone work begin)
4. **Dismissal handling**: Nudges can be dismissed for a session. Never persisted as "ignored forever."
5. **Frequency limit**: Same nudge for same milestone is shown at most once per session
6. **Tests**: Readiness check accuracy, nudge generation, frequency limiting

### Key Decisions
- Nudges are non-blocking by absolute design. They cannot prevent work from happening.
- Dismissal is session-scoped, not persistent. Each new session re-checks readiness.
- Nudge text is generated from templates, not AI. Predictable and gentle.

### Files
- `src/lib/campaign/sustainability/readiness-check.ts`
- `src/lib/campaign/sustainability/nudge-generator.ts`
- `src/actions/milestone-sustainability.ts` — readiness check action

## Phase 5 — UI Components

**Goal**: Owners can see flags, create supports, and respond to nudges in a coherent UI.

### Steps

1. **Sustainability flag display**: Component showing drain types, severity, reasoning on milestone view
2. **Support creation form**: Type-aware form (different fields per support type). Browseable from drain recommendations.
3. **Support library browser**: List view of player's support structures with filtering
4. **Nudge component**: Soft toast or inline warning for readiness check results
5. **Milestone-supports panel**: On milestone view, show attached/pending/declined supports
6. **Wire into existing campaign dashboard**

### Key Decisions
- All UI is non-blocking. No modals that prevent dismissal.
- Forms guide owners toward concrete commitments (named persons, specific budgets, real cadences).
- Support library is browseable for reuse, not just "list of all supports."

### Files
- `src/components/campaign/sustainability/SustainabilityFlagBadge.tsx`
- `src/components/campaign/sustainability/SupportCreationForm.tsx`
- `src/components/campaign/sustainability/SupportLibraryBrowser.tsx`
- `src/components/campaign/sustainability/NudgeToast.tsx`
- `src/components/campaign/sustainability/MilestoneSupportsPanel.tsx`

## Verification

After each phase:
- `npm run build` — passes
- `npm run check` — passes
- Unit tests for detection, validation, readiness checks

## Risk Notes

- **Detection false positives**: Keyword-based detection may flag milestones that aren't actually draining. Tunable keywords mitigate, but tuning is ongoing work.
- **Support theater**: Owners may create supports without putting them in place. The "in-place" state plus nudges mitigate, but ultimately the owner must follow through.
- **Notification fatigue**: Partner notifications must integrate with existing notification preferences to avoid spam.
- **AI vs deterministic**: This spec uses deterministic detection. A future version could augment with AI suggestions, but determinism is the baseline.
- **Cultural sensitivity**: "Drain types" are framed neutrally, but some milestones are inherently hard work. Detection must not pathologize necessary effort.
