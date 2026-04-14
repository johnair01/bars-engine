# Plan: Milestone Completion Feelings

## Overview

Implement completion feeling tagging in four phases: predictions, reports, alignment, and Q2 verification. Each phase ships independently and builds on the campaign-lifecycle spec.

## Phase 1 — Predictions on Milestones

**Goal**: Owners can tag milestones with predicted completion feelings.

### Steps

1. **Schema migration**: Add `predictedFeelings` JSON field to `CampaignMilestone`
2. **Server actions**: Implement `setMilestoneFeelings` and `setCampaignMilestoneFeelings`
3. **Validation**: Soft warning when a milestone has empty `predictedFeelings`
4. **Display**: Show predicted feelings in milestone view
5. **Tests**: Setting feelings, validation, retrieval

### Key Decisions
- Predicted feelings are stored as JSON, not normalized into rows. Simpler queries, no join overhead.
- Validation is soft (warning, not error). Owners can ship milestones with no predictions if they want.
- Each prediction has an expected intensity (1-5) so the "promise" is calibrated.

### Files
- `prisma/schema.prisma` — model changes
- `src/actions/milestone-feelings.ts` — server actions
- `src/lib/campaign/feelings/predictions.ts` — prediction logic + validation
- `src/lib/campaign/feelings/types.ts` — feeling vocabulary

## Phase 2 — Player Reports

**Goal**: Players self-report what they actually felt after completing a milestone.

### Steps

1. **Schema migration**: Add `FeelingReport` model
2. **Server actions**: Implement `submitFeelingReport`, `getPlayerFeelingReports`
3. **Submission UI**: Add report form to milestone completion flow
4. **Privacy enforcement**: Player reports only visible to player; aggregated for owner
5. **Immutability**: Reports cannot be edited or deleted after submission
6. **Tests**: Report submission, retrieval, privacy boundaries, immutability

### Key Decisions
- Reports are immutable. Players who feel differently later can submit a new report (additive, not corrective).
- Multiple reports per player per milestone are allowed (different feelings, different intensities).
- Optional `note` field allows qualitative context without forcing it.

### Files
- `prisma/schema.prisma` — FeelingReport model
- `src/actions/milestone-feelings.ts` — extend with report actions
- `src/lib/campaign/feelings/reports.ts` — report logic
- `src/components/milestone/FeelingReportForm.tsx` — submission UI

## Phase 3 — Alignment & Profiles

**Goal**: System computes alignment between predicted and actual feelings, and campaign-level profiles.

### Steps

1. **Alignment computation**: Implement `computeMilestoneAlignment` — compare predicted vs actual, identify surprises and misses
2. **Profile computation**: Implement `computeCampaignFeelingProfile` — aggregate predictions and actuals across all milestones
3. **Alignment scoring**: Algorithm — predicted feelings present in reports score 1.0, missing predictions score 0.0, intensity gap penalizes
4. **Owner display**: Build alignment view in milestone detail
5. **Campaign dashboard**: Build feeling profile panel
6. **Tests**: Alignment scoring, profile aggregation, surprise/miss detection

### Key Decisions
- Alignment is read-time computation, not stored. Always reflects current report state.
- Surprises (unpredicted but felt) are highlighted as positive — they teach the owner what their work actually produces.
- Misses (predicted but not felt) are diagnostic — may indicate the milestone needs redesign.

### Files
- `src/lib/campaign/feelings/alignment.ts` — alignment computation
- `src/lib/campaign/feelings/profile.ts` — campaign profile aggregation
- `src/components/milestone/FeelingAlignmentView.tsx`
- `src/components/campaign-dashboard/FeelingProfilePanel.tsx`

## Phase 4 — Q2 Verification

**Goal**: Owner's Q2 desired feeling answer is parsed into structured tags, and coverage is verified against milestone predictions.

### Steps

1. **Parser**: Implement `parseDesiredFeelings` — keyword-based mapping of free text to the five-feeling vocabulary
2. **Storage**: Add `parsedDesiredFeelings` field to campaign instance, populated during interview
3. **Verification**: Implement `verifyDesiredFeelingCoverage` — check that predicted feelings cover all desired feelings
4. **Setup warnings**: Surface coverage warnings during campaign setup
5. **Resolution flow**: Link uncovered feelings back to milestone editor for revision
6. **Tests**: Parser determinism, coverage detection, resolution flow

### Key Decisions
- Parser is deterministic keyword matching. Each feeling has a list of trigger words. No AI.
- Owner can override parsed result if they disagree with the parser's interpretation.
- Coverage warning is non-blocking — owner can ship without full coverage.

### Files
- `src/lib/campaign/feelings/parser.ts` — desired feeling parser
- `src/lib/campaign/feelings/verification.ts` — coverage verification
- `src/components/campaign-setup/DesiredFeelingCoverageWarning.tsx`

## Verification

After each phase:
- `npm run build` — passes
- `npm run check` — passes
- Unit tests for parser, alignment, profile aggregation

## Risk Notes

- **Parser keyword maintenance**: Trigger words for each feeling need ongoing tuning. Start with the indicators in the spec, refine based on real interview answers.
- **Report fatigue**: Asking players to report feelings after every milestone may be tiresome. Consider sampling — only ask after major milestones.
- **Privacy concerns**: Even aggregated, owner can see which feelings their campaign produces. Anonymization is essential when player count is small.
- **Five-feeling rigidity**: The vocabulary is hardcoded. If players consistently report feelings that don't fit the five, the vocabulary may need to expand. Track unmatched reports as a signal.
