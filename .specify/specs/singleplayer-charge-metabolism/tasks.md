# Tasks: Singleplayer Charge Metabolism (GF)

All tasks completed across GL, GLCC, CFI, and PCM specs.

## Core loop

- [x] `persist321Session` — creates Shadow321Session with outcome enum
- [x] `fuelSystemFrom321` — fuels system with metadata from 321
- [x] `createQuestFrom321Metadata` — creates quest from 321 with prefill
- [x] Shadow321Runner → `stashQuestWizardPrefillFrom321` → quest wizard

## Friction subquest

- [x] `recordQuestFriction(questId, frictionType)` — `src/actions/friction.ts`
- [x] `createSubQuest(parentId, { frictionNote, isKeyUnblocker })` — friction suffix in description
- [x] "I'm stuck" button in QuestDetailModal records friction + offers subquest

## Tetris key-unlock

- [x] On `isKeyUnblocker` create: block root + siblings (`status: 'blocked'`)
- [x] On key completion: unblock root + siblings (`status: 'active'`)

## Metabolizability learning

- [x] `Shadow321Session.questCompletedAt` updated when linked quest completes
- [x] `questCompletedAt` in `quest-engine.ts` → `shadow321Session.updateMany`

## PCM bridge

- [x] `personal_move` at charge capture flows into `alignedAction` in 321 runner and quest wizard prefill
