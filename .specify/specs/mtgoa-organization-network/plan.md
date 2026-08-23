# Implementation Plan: MTGOA Organization + Campaign Network

**Branch**: `codex/mtgoa-first-loop-live-field` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

## Summary

Build an authenticated-free `/organization` page as the public organizational layer for MTGOA. Release 1 uses reviewed TypeScript content and links to existing BARS campaign surfaces. It does not add a database table, duplicate Ally Campaign intake, or represent unconfirmed work as live.

Later releases add public campaign briefs/workboards over existing Campaign, CampaignMilestone, MilestoneNeed, CampaignLead, CollectiveOffer, and CampaignMembership records.

## Technical Context

**Language/Version**: TypeScript, Next.js App Router, React, Prisma  
**Primary Dependencies**: Existing BARS components and Ally Campaign actions; no new external service for Release 1  
**Storage**: Release 1—versioned TypeScript public config. Release 2—existing PostgreSQL/Prisma campaign models plus a narrow work-card extension.  
**Testing**: Existing TypeScript build/type-check plus focused unit tests for public configuration validation and route rendering  
**Target Platform**: Existing BARS web application  
**Project Type**: Next.js web application  
**Performance Goals**: Public page renders without a client-side data-fetching waterfall; one initial server render.  
**Constraints**: No sign-in gate, no private campaign/lead data in public HTML, no duplicate intake, no migration in Release 1.  
**Scale/Scope**: One MTGOA organization page and Book Launch campaign in Release 1.

## Constitution Check

The repository’s `.specify/memory/constitution.md` is a placeholder rather than enforceable project-specific law. This plan follows the practical repository conventions visible in current campaign specs:

- Reuse existing models/actions before adding abstractions.
- Keep public and steward data boundaries explicit.
- Keep route behavior deterministic and content reviewable.
- Ship independently testable slices.

**Gate result:** Pass for Release 1. No new service, database model, auth flow, or message system is proposed.

## Project Structure

```text
.specify/specs/mtgoa-organization-network/
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── plan.md
├── tasks.md
└── contracts/public-routes.md

src/
├── app/organization/page.tsx
├── components/organization/OrganizationLanding.tsx
├── lib/mtgoa-course/organization-state.ts
└── lib/mtgoa-course/__tests__/round-two.test.ts
```

**Structure Decision:** Release 1 is a Server Component route plus a typed public-state module and a presentational component. Keep content in code because facts are still steward-reviewed and mutable in PRs. Do not introduce a CMS before the campaign network has settled its operating rhythm.

## Phase 0 — confirm public facts

1. Campaign Steward confirms MTGOA public purpose statement.
2. Campaign Steward confirms Book Launch is public, its 500-copy goal, current steward label, verified purchase link, and which contribution links are live.
3. Campaign Steward confirms whether Book Tour Help, nonprofit, and podcast guest routes are linked as information, action, or omitted.

**Exit condition:** every Release 1 CTA has a real route and owner.

## Phase 1 — P1 public organization page

1. Extend the existing typed `organization-state.ts` with reviewed Book Launch facts and links; add validation coverage for public-state invariants.
2. Build `/organization` using the app’s established visual language and accessible heading/link structure.
4. Include Book Launch as the first campaign; hide unconfirmed campaigns and partners.
5. Link only to existing, confirmed route surfaces.
6. Add page-specific metadata and Open Graph configuration.
7. Add unit tests for config invariants and a route-render smoke test if the current test setup supports it.

**Exit condition:** User Story 1 works without sign-in or a database migration.

## Phase 2 — P2 public campaign brief and workboard

1. Decide whether campaign public-state belongs in typed config or validated Campaign fields.
2. Extend `MilestoneNeed` with required public-work presentation fields and access policy; migrate only after there is a real Book Launch need to seed.
3. Add public `/organization/campaigns/[slug]` and `/work` queries that never read private leads or steward notes.
4. Connect public action/offer routes to existing accountless lead and collective-offer workflows.
5. Test that each access policy prevents unintended contact disclosure.

**Exit condition:** User Stories 2 and 3 work with a real open Book Launch card and an existing steward board.

## Phase 3 — P3 campaign network, partnerships, and Deck Weaves

1. Seed child campaign hierarchy once each campaign has a brief and steward.
2. Add reviewed public partner configuration; model it only after relationship permissions/history require it.
3. Attach ordered Deck Weave configuration to a need/quest when one canonical card cannot support the real action alone.
4. Add stewardship interest route with explicit scope/terms.
5. Publish aggregate campaign outcomes only; never use a global participant score.

## Complexity Tracking

| Potential complexity | Decision |
| --- | --- |
| New Organization model | Deferred. A page and reviewed content solve Release 1. |
| New volunteer/messaging system | Rejected. Existing Ally Campaign + steward routing are sufficient. |
| Global reputation or token ledger | Rejected. Existing units remain separate and campaign-specific. |
| New card/deck database | Rejected. Use canonical Allyship Deck IDs and existing data. |
