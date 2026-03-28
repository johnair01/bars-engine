# Tasks: Daemon Move System

## Spec kit
- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [ ] Register in `.specify/backlog/BACKLOG.md` (row DMS, priority 1.65)
- [ ] Run `npm run backlog:seed`

## DMS-1: Schema + Migration

- [ ] Add `DaemonMoveCreation` model to `prisma/schema.prisma`
- [ ] Extend `Daemon`: add `channel String?`, `altitude String?`, `collective Boolean @default(false)`, `communityScope String?`
- [ ] Extend `NationMove`: add `tier String?`, `origin String?`, `channel String?`, `moveFamilyId String?`, `parentMoveId String?`, `deprecatedAt DateTime?`, `supersededById String?`
- [ ] Extend `QuestMoveLog`: add `outcome String?`
- [ ] Run `npx prisma migrate dev --name add_daemon_move_system`
- [ ] Backfill: existing `NationMove` records → `tier='CANONICAL'`, `origin='GM_AUTHORED'` via migration SQL
- [ ] Commit migration + schema
- [ ] Run `npm run db:sync` + `npm run check`

## DMS-2: Level Computation + Move Injection Routing

- [ ] Create `src/lib/daemon-moves/compute-level.ts` — `computeDaemonLevel(daemonId): number`
  - [ ] Outcome weights: `ABANDONED=0.25, COMPLETED=1.0, BAR_WRITTEN=1.5, BAR+vow=2.0, nominated_to_canonical=5.0`
- [ ] Create `src/lib/daemon-moves/move-injection.ts` — `getChannelAppropriateMove(channel, daemonId): NationMove[]`
- [ ] Edit `src/lib/alchemy/select-scene.ts` — route by `daemon.channel`, remove Metal default assumption
- [ ] Test: Daemon with WOOD channel → gets Wood moves, not Metal

## DMS-3: Shadow321Runner + Somatic Gate

- [ ] Edit `src/app/shadow/321/Shadow321Runner.tsx`:
  - [ ] Add `Face / Talk / Be` steps per scene-card grammar before daemon awakening
  - [ ] Add somatic gate step: body location + felt-sense question (required, not bypassable)
- [ ] Edit `src/actions/daemons.ts` — `awakenDaemonFrom321` stores `channel` + `altitude` at discovery
- [ ] Test: Full 321 flow → daemon created with correct `channel` + `altitude`

## DMS-4: Custom Move Creation + DaemonMoveCreation

- [ ] Create `src/actions/daemon-moves.ts`:
  - [ ] `createCustomMove(input)` — creates `DaemonMoveCreation` with raw text fields + `channel`
  - [ ] `recordQuestMoveOutcome(input)` — sets `QuestMoveLog.outcome`; returns recomputed level
  - [ ] `declareMoveVow(input)` — stores vow; recalculates level with `BAR+vow` weight
- [ ] Create `src/lib/daemon-moves/semantic-fingerprint.ts` — fuzzy near-match suggestions (non-blocking)
- [ ] Test: `createCustomMove` → `DaemonMoveCreation` record with all raw fields

## DMS-5: Vow Mechanic

- [ ] Add "Vow to [daemon]" UI after BAR completion when player has active daemon
- [ ] `declareMoveVow` stores witness declaration; triggers level recomputation
- [ ] Test: complete BAR → vow flow appears → daemon level updates

## DMS-6: Move Nomination + Admin Governance

- [ ] Add `nominateMove(input)` to `src/actions/daemon-moves.ts` — promotes `CUSTOM` to `CANDIDATE`; runs semantic fingerprint check
- [ ] Create `src/actions/daemon-moves-admin.ts` — `reviewMoveNomination`, `getMoveCandidates`
- [ ] Create `src/app/admin/daemon-moves/page.tsx` — CANDIDATE move queue with nomination statements
- [ ] Test: nominate → CANDIDATE status → admin approves → CANONICAL

## DMS-7: Canonical Move Seed

- [ ] Create `src/lib/starter-canonical-moves/` with GM-authored canonical moves:
  - [ ] ≥20 total across all 5 elements
  - [ ] At least one DESCENT, WITNESS, CONTAINMENT, DISCHARGE per element or shared cross-element
- [ ] Seed script + `npm run seed:canonical-moves`

## DMS-8: Certification Quest

- [ ] Seed `cert-daemon-move-system-v1` Twine + `CustomBar`
- [ ] Add `npm run seed:cert:daemon-move-system` to `package.json`

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes (0 TypeScript errors)
- [ ] Full loop: `/shadow/321` → somatic gate → daemon discovery with channel → move injection routes correctly → BAR → vow → level update
- [ ] Admin: nominate → CANDIDATE → Regent approves → CANONICAL
- [ ] AI_PROPOSED moves visually distinct in UI; require player confirmation
