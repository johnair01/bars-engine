# Plan: Daemon Move System

## Architecture

The Daemon Move System extends three existing subsystems: `Daemon` (schema + actions), `NationMove` (schema + canonical set), and `Shadow321Runner` (UI + flow). No existing subsystems are replaced. The level computation is a pure read-time function (`computeDaemonLevel`) that aggregates `QuestMoveLog.outcome` weights — it does not add a stored counter.

## File Impact

### New Files

| File | Purpose |
|------|---------|
| `prisma/migrations/[ts]_add_daemon_move_system/` | Adds `DaemonMoveCreation`; extends `Daemon`, `NationMove`, `QuestMoveLog` |
| `src/lib/daemon-moves/compute-level.ts` | `computeDaemonLevel(daemonId): number` — weighted outcome sum |
| `src/lib/daemon-moves/move-injection.ts` | `getChannelAppropriateMove(channel, daemonId): NationMove[]` — routes by element, not Metal default |
| `src/lib/daemon-moves/semantic-fingerprint.ts` | `checkMoveFingerprint(text): NearMatch[]` — surfaces near-canonical moves before custom creation |
| `src/actions/daemon-moves.ts` | `createCustomMove`, `nominateMove`, `recordQuestMoveOutcome`, `declareMoveVow` |
| `src/actions/daemon-moves-admin.ts` | `reviewMoveNomination`, `getMoveCandidates` (admin) |
| `src/app/admin/daemon-moves/page.tsx` | Admin queue: CANDIDATE moves with nomination statements |
| `src/lib/starter-canonical-moves/` | GM-authored canonical moves for all 5 elements × 4 classes |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `DaemonMoveCreation`; extend `Daemon`, `NationMove`, `QuestMoveLog` |
| `src/app/shadow/321/Shadow321Runner.tsx` | Add `Face / Talk / Be` grammar steps + somatic gate before daemon summon |
| `src/actions/daemons.ts` | `awakenDaemonFrom321` stores `channel` + `altitude` at discovery |
| `src/lib/alchemy/select-scene.ts` | Route move injection by `daemon.channel`, not Metal default |

## Key Patterns

- **Level is computed, not stored**: `computeDaemonLevel` reads `QuestMoveLog` entries filtered by `Daemon.moves` and applies outcome weights. No `Daemon.level` counter — this prevents stale counts.
- **Witnessed vs. unwitnessed**: `NationMove.origin` is the visual trust signal in UI. `AI_PROPOSED` requires player confirmation before being active. This is not technical gating — it's visual provenance.
- **Move creation lineage**: `DaemonMoveCreation` captures raw 321 answer text. The `moveId` FK is nullable at creation — set only after the player incubates the insight into a named move.
- **Somatic gate is mandatory**: The body location / felt-sense question at `/shadow/321` is a non-negotiable UX step. Do not add a skip path.

## Dependencies

- `src/lib/quest-grammar/` — `MoveFamily`, `EmotionalVector`
- `src/lib/alchemy/wuxing.ts` — element definitions
- Existing `NationMove` seed data — will be extended with new `tier/origin/channel` fields (nullable initially, then backfilled)
- `src/app/shadow/321/Shadow321Runner.tsx` — existing 3-2-1 runner to extend

## Risk / Trade-offs

- `NationMove` field additions are nullable for backward compat — existing canonical moves need a backfill migration setting `tier='CANONICAL'` and `origin='GM_AUTHORED'`.
- Semantic fingerprint is a best-effort fuzzy match — do not block move creation on it, only surface suggestions.
- Level computation runs on every daemon profile page load — consider caching if > 100 move log entries per daemon.
