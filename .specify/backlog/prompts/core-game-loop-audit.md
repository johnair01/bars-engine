# Prompt: Core Game Loop Audit — pave the loop's holes

**Use when implementing any remediation from the core-game-loop audit.** The loop
`capture → charge → 3·2·1 → quest → daemon` mostly exists as actions but is
fractured across pages; TTV is islanded from BARs.

## Context
- Audit + remediations: [.specify/specs/core-game-loop-audit/spec.md](../../specs/core-game-loop-audit/spec.md)
- Existing mechanics: `captureBar` (`src/actions/capture-bar.ts`), `growQuestFromBar` / `growDaemonFromBar` / `growArtifactFromBar` (`src/actions/bars.ts`), `GrowFromBar` on `/bars/[id]`, `/shadow/321?chargeBarId=`, `/daemons` + `discoverDaemon`.
- TTV: `src/actions/tap-the-vein.ts` — commits tasks but creates no `CustomBar`.

## Holes (independently shippable; build H1 first)
- **H1** TTV tasks → BARs (add `TapTheVeinTask.barId`; `commitTask` creates a linked BAR; `upgradeTaskToQuest` → `growQuestFromBar`).
- **H3** "Do a 3·2·1 on this" button on a BAR / charge card.
- **H2** Unified "all my BARs" view (reuse `list*` actions).
- **H6** Inline tune on `/bars/[id]`.
- **H4** Charge an existing BAR (model decision: extend `intensity` vs charge→BAR link).
- **H5** Daemon hub to browse/connect (own spec).

## Prompt text
> Implement per [.specify/specs/core-game-loop-audit/tasks.md](../../specs/core-game-loop-audit/tasks.md) in order (H1 first). API-first; reuse existing capture/grow/321 mechanics — don't rebuild them. Each user-facing slice ships `npm run build` + `npm run check` and a `cert-*` verification quest. Migrations authored DB-free per docs/PRISMA_MIGRATE_STRATEGY.md (`db push` forbidden).

## Checklist
- [ ] H1 TTV→BAR (`barId` + `commitTask` bridge + real upgrade-to-quest)
- [ ] H3 3·2·1-from-BAR button
- [ ] H2 unified BAR view
- [ ] H6 inline tune
- [ ] H4 charge-on-BAR (after model decision)
- [ ] H5 daemon hub (after sub-spec)

## Reference
- Spec/plan/tasks: [.specify/specs/core-game-loop-audit/](../../specs/core-game-loop-audit/)
- Related: [tap-the-vein-tier-2](../../specs/tap-the-vein-tier-2/spec.md) (H1 is the TTV bridge), navigation-contract (`src/lib/navigation-contract.ts`)
