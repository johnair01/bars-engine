# Plan: Tap the Vein — Tier 2

Implements the four deferred subsystems on top of the Tier 1 build (PR #144).
Build **Phase A first** (mint/spend primitives); B/C/D depend on it and are
otherwise independent.

## Architecture / file impacts

### Phase A — TTVE (economy)
- `prisma/schema.prisma`: `TapTheVeinTask.rewardMintedAt DateTime?` → migration.
- `src/actions/tap-the-vein.ts`: add `completeTask`; mint via existing
  `src/actions/economy.ts` (wallet) in the same transaction; idempotent on
  `rewardMintedAt`. Keep `updateTaskStatus` for non-completion transitions.
- `src/app/tap-the-vein/TaskActionSheet.tsx` + `TapTheVeinRunner.tsx`: route
  "Complete" through `completeTask`; Work "Reserve" + Seal "Minted" read real ♦.

### Phase B — TTV321 (inline thread)
- Reuse `Shadow321Session` (add `chargeBefore/chargeAfter` if absent) +
  `TapTheVeinDailySession.clean321SessionId` → migration.
- Actions: `start321 / append321Message / finish321`.
- New `src/app/tap-the-vein/Clean321Thread.tsx` (chat thread; voice switcher on
  phase 2 only); slot between Brainstorm and Commit with a Skip path.
- Charge bonus via TTVE on `finish321`.

### Phase C — TTVS (storm/vault)
- New `TapTheVeinIdea` model → migration.
- Actions: `startStorm / addIdea / distill / mergeIdeas / sendToVault`
  (vault economy via TTVE; integrate `HandSlot`).
- New `src/app/tap-the-vein/IdeaStorm.tsx` + `Distill.tsx`; distilled set feeds
  the Commit phase.

### Phase D — TTVU (upgrade ceremony)
- `TapTheVeinTask.daemonId String?` + `upgraded_to_daemon` status → migration.
- Action: `upgradeTask(taskId, target)` — calls existing quest-creation / daemon
  actions, spends ♦ via TTVE, links the id.
- New `src/app/tap-the-vein/UpgradeCeremony.tsx` (Ritual interaction state).

## Cross-cutting
- All ♦ flows go through one helper so amounts live in one place; confirm
  amounts against the live economy before locking.
- Each phase: `npm run build` + `npm run check` (fail-fix); migration committed
  with schema; verification quest seeded.
- Prisma engine note: in DB-less sandboxes, generate the client against a
  prebuilt engine (see PR #144 session notes) — `db push` remains forbidden.
