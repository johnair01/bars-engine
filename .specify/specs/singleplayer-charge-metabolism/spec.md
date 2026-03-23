# Spec: Singleplayer Charge Metabolism (GF)

## Purpose

Give solo players a complete metabolization loop: a raw charge → 321 shadow work → quest/BAR/fuel/daemon, with optional friction subquest (tetris key-unlock pattern) when blocked, and metabolizability learning that tracks whether 321-sourced quests are ever completed.

## Implemented as of 2026-03-22

All four pillars shipped across GL, GLCC, CFI, PCM, and related specs:

| Pillar | Key files | Status |
|--------|-----------|--------|
| **321 → quest/bar/fuel** | `src/actions/charge-metabolism.ts` · `fuelSystemFrom321`, `createQuestFrom321Metadata`, `persist321Session` | ✓ Done |
| **Friction subquest** | `src/actions/quest-nesting.ts` · `createSubQuest(frictionNote, isKeyUnblocker)` · `src/actions/friction.ts` · `recordQuestFriction` | ✓ Done |
| **Tetris key-unlock** | `quest-nesting.ts` — on `isKeyUnblocker` create, root + siblings set `status: 'blocked'`; `quest-engine.ts` — on key completion, `status: 'active'` restored | ✓ Done |
| **Shadow321Session + metabolizability** | `prisma/schema.prisma` · `Shadow321Session` · `persist321Session` · `quest-engine.ts` updates `questCompletedAt` | ✓ Done |

### PCM bridge (2026-03-22)

`personal_move` committed at charge capture now pre-fills `alignedAction` in the 321 runner, flowing through to `displayHints` in quest wizard prefill and `phase2Snapshot.moveType` in Shadow321Session.

## Dependencies

CM and CN (original backlog refs) — these were informal shorthand for the charge and 321 infrastructure that shipped incrementally via GL, GLCC, CFI, PCM. No further items pending.
