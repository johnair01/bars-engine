# Plan: Creator Milestone Interview

## Architecture

Extends the existing campaign hub/spoke architecture. New models (`MilestoneInterviewTemplate`, `CampaignMilestone`) live alongside the existing `Instance`/`CustomBar` schema. Server actions in `src/actions/milestone-interview.ts` follow the same `'use server'` pattern as `campaign-spoke-states.ts`. The rules-based BAR generator is a pure TypeScript function — no AI SDK calls in Phase 1.

## File Impact

### New Files

| File | Purpose |
|------|---------|
| `prisma/migrations/[ts]_add_milestone_interview_schema/` | Migration: `MilestoneInterviewTemplate` + `CampaignMilestone` |
| `src/actions/milestone-interview.ts` | `getMilestoneInterviewTemplate`, `createMilestoneInterview`, `retakeMilestoneInterview`, admin CRUD |
| `src/lib/milestone-interview/generate-bars.ts` | Rules-based BAR generator: `generateBarsFromAnswers(answers, archetypeKey): BarSeed[]` |
| `src/app/campaign/[campaignRef]/interview/page.tsx` | Server page: fetches template, renders wizard |
| `src/app/campaign/[campaignRef]/interview/InterviewWizard.tsx` | Client step wizard (mirrors 3-2-1 UX) |
| `src/app/admin/interview-templates/page.tsx` | Admin: list templates |
| `src/app/admin/interview-templates/[archetypeKey]/page.tsx` | Admin: edit template questions |
| `scripts/seed-milestone-interview-templates.ts` | Seeds default templates for existing campaign archetypes |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `MilestoneInterviewTemplate` + `CampaignMilestone` models |
| `src/app/admin/layout.tsx` | Ensure `interview-templates` route is accessible to GM role |

## Key Patterns

- **Rules-based BAR generator**: `answer.barHint` maps to a deterministic `CustomBar` seed. Each question answer contributes one `BarSeed`; deduplication by `barHint` type before creation.
- **Idempotent milestone**: `upsert` on `(campaignRef, creatorId)` — multiple retakes increment `retakeCount`, append to `barIds[]`.
- **Step wizard**: Client component holds all answers in React state. Single server action call on final submit (no intermediate writes).
- **Anonymous auth**: If no session, answers are persisted in `sessionStorage`; on completion, redirect to `/join?callbackUrl=/campaign/[ref]/interview?resume=1`.

## Dependencies

- `src/actions/campaign-bar.ts` — BAR creation patterns to follow
- `src/actions/campaign-spoke-states.ts` — pattern for campaign context server actions
- `src/lib/campaign-hub/types.ts` — `isCampaignHubStateV1` for context

## Risk / Trade-offs

- Rules-based generator is intentionally simple. AI personalization is explicit Phase 2 — do not pre-abstract for it.
- `MilestoneInterviewTemplate` is per-archetype-key, not per-campaign. This means one shared template across all campaigns of a given archetype type. Phase 2 can add per-campaign overrides if needed.
