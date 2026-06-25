# Tasks: Tap the Vein — Tier 2

Build Phase A first. B / C / D depend on A, otherwise independent. Each phase
ends with `npm run build` + `npm run check` and its verification quest.

## Phase A — TTVE · economy  (TTVE)
- [ ] A1. Schema: `TapTheVeinTask.rewardMintedAt DateTime?`; `prisma migrate dev --name ttv_reward_minted`; commit migration.
- [ ] A2. `completeTask(taskId)` action: set `completed`, mint ♦+1 via `economy.ts` in one tx, idempotent on `rewardMintedAt`, write ledger row.
- [ ] A3. Route the sheet "Complete" + work-screen complete through `completeTask`; wire real ♦ into Work "Reserve" and Seal "Minted" tile.
- [ ] A4. Verification quest `cert-ttv-economy-v1` (Twine + seed).

## Phase B — TTV321 · inline 3·2·1  (TTV3)
- [ ] B1. Schema: `TapTheVeinDailySession.clean321SessionId String?` (+ `Shadow321Session.chargeBefore/After` if absent); migrate + commit.
- [ ] B2. Actions: `start321 / append321Message / finish321` (autosave; charge bonus via TTVE when drop > 2).
- [ ] B3. `Clean321Thread.tsx` chat UI — voice switcher only on phase 2; Skip path between Brainstorm and Commit.
- [ ] B4. Verification quest `cert-ttv-321-v1`.

## Phase C — TTVS · idea storm → distill → vault  (TTVS)
- [ ] C1. Schema: `TapTheVeinIdea` (fate enum-as-string, mergedFromIds); migrate + commit.
- [ ] C2. Actions: `startStorm / addIdea / distill / mergeIdeas / sendToVault` (5-free-then-♦1 via TTVE; `HandSlot` integration).
- [ ] C3. `IdeaStorm.tsx` (timed dump, raw rows) + `Distill.tsx` (triage to 5, merge, vault); feed distilled set into Commit.
- [ ] C4. Verification quest `cert-ttv-storm-v1`.

## Phase D — TTVU · upgrade ceremony  (TTVU)
- [ ] D1. Schema: `TapTheVeinTask.daemonId String?` + allow `upgraded_to_daemon`; migrate + commit.
- [ ] D2. `upgradeTask(taskId, target)` — create Quest/Daemon via existing actions, spend ♦ via TTVE, link id.
- [ ] D3. `UpgradeCeremony.tsx` — Ritual interaction state (double glow, scale-up, 432 Hz, reduced-motion safe).
- [ ] D4. Verification quest `cert-ttv-upgrade-v1`.

## Definition of done (per phase)
- [ ] Migration committed with schema; `db push` not used.
- [ ] `npm run build` + `npm run check` pass.
- [ ] Verification quest seeded and passes.
- [ ] ♦ amounts confirmed against the live economy.
