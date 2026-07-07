# Prompt: Tap the Vein — Tier 2 (economy · inline 3·2·1 · idea storm/vault · upgrade ceremony)

**Use when implementing any Tier 2 phase of Tap the Vein.** Tier 1 (ritual page
+ NOW panel) shipped in PR #144. These four subsystems were deferred because each
needs new data + economy wiring.

## Context
- Tier 1 models/actions: `TapTheVeinDailySession` / `TapTheVeinTask`,
  `src/actions/tap-the-vein.ts`, page `src/app/tap-the-vein/`.
- Design source: `docs/plans/2026-06-24-tap-the-vein-ui-design-spec.md` + the
  Claude Design handoff (screens 06/09/12, 16–25).
- Currency: reuse the existing Vibeulon wallet/ledger (`db.vibulon`,
  `src/actions/economy.ts`) — no parallel currency.

## Phases (build A first; B/C/D depend on A)
- **TTVE** — mint ♦+1 on complete (idempotent via `rewardMintedAt`); spend/mint primitives.
- **TTV3** — inline 3·2·1 thread (voice switcher on phase 2 only) + before/after charge sliders; drop > 2 → ♦+1 bonus. Reuse `Shadow321Session`.
- **TTVS** — timed idea storm → distill to ≤5 → merge → Vault (5 free/day then ♦1); integrate `HandSlot`.
- **TTVU** — upgrade ceremony → create real Quest **or** Daemon, spend ♦, link id.

## Prompt text
> Implement per [.specify/specs/tap-the-vein-tier-2/tasks.md](../../specs/tap-the-vein-tier-2/tasks.md) **in phase order, starting with TTVE**. API-first: define the action signatures in the spec before UI. Each phase commits its Prisma migration with the schema, passes `npm run build` + `npm run check`, and ships its `cert-ttv-*` verification quest. Confirm all ♦ amounts against the live economy before locking.

## Checklist
- [ ] TTVE: `rewardMintedAt` migration + `completeTask` (idempotent mint) + real ♦ in Work/Seal
- [ ] TTV3: `clean321SessionId` link + 3·2·1 thread actions/UI + charge bonus
- [ ] TTVS: `TapTheVeinIdea` + storm/distill/merge/vault actions + UI
- [ ] TTVU: `daemonId` + `upgradeTask` + ceremony UI
- [ ] `npm run build`, `npm run check`; migrations committed; certs seeded

## Reference
- Spec: [.specify/specs/tap-the-vein-tier-2/spec.md](../../specs/tap-the-vein-tier-2/spec.md)
- Plan: [.specify/specs/tap-the-vein-tier-2/plan.md](../../specs/tap-the-vein-tier-2/plan.md)
- Related: [321-shadow-process](../../specs/321-shadow-process/spec.md), [bar-seed-metabolization](../../specs/bar-seed-metabolization/spec.md), `src/actions/economy.ts`
