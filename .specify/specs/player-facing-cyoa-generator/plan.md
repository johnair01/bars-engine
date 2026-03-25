# Plan: Player-facing CYOA generator

## Guiding sequence

1. **Dominion & policy clarity** — Map instance/campaign roles to `submitCyoaProposalToCampaign` eligibility; document matrix in `spec.md` / this plan (no code until tasks say so).
2. **Artifact choice** — Decide v1 target: new `Adventure` (player-owned draft flag) vs extend `QuestProposal` / new `CyoaGeneratorProposal` table; lock in `tasks.md` Phase 0.
3. **CMA / player palette extension (design)** — How approved CYOA attaches to campaign hub / spokes (reference campaign-hub-spoke-landing-architecture); design-only until modular IR round-trip is proven per cyoa-modular-charge-authoring.
4. **Proposal queue** — Steward UI pattern (reuse admin quest proposal lists if any); API contracts first.
5. **Private draft MVP** — `createCyoaGeneratorDraft` + `validateCyoaGraph` + preview surface.
6. **Unlisted playtest** — Token URL, rate limits.
7. **AI fill (later)** — Opt-in node copy only after graph valid.

## File impacts (expected — do not implement ahead of tasks)

| Area | Files (illustrative) |
|------|----------------------|
| Schema | `prisma/schema.prisma` — draft/proposal models when Phase 0 locked |
| Actions | `src/actions/cyoa-generator.ts` (new) or split by phase |
| UI | `src/app/.../cyoa-generator/` routes; reader reuse |
| Lib | `src/lib/cyoa-generator/` validation, types |
| Seeds | Verification quest seed + npm script when UX exists |

## Verification

- After implementation: `npm run build` && `npm run check`
- Manual: verification quest `cert-player-facing-cyoa-generator-v1`
- Optional research enrich: `strand_run` (research) → append to [STRAND_OUTPUT.md](./STRAND_OUTPUT.md)
