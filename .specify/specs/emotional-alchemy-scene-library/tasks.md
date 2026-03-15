# Tasks: Emotional Alchemy Scene Library v1

See also: [agentic-npc-constitution/tasks.md](../agentic-npc-constitution/tasks.md) — AES-1 and AES-2 tasks are co-located there.

## AES-1: Alchemy State Model

- [x] Add `AlchemyPlayerState` + `AlchemySceneEvent` to prisma/schema.prisma
- [x] Add `AlchemyAltitude` type to `src/lib/alchemy/types.ts`
- [x] Implement `getPlayerAlchemyState`, `setPlayerAlchemyState`, `advancePlayerAltitude` in `src/actions/alchemy.ts`
- [x] Add `AlchemyCheckIn` model (daily check-in with stuckness, channel, altitude, sceneType)
- [x] Add `getTodayCheckIn`, `createDailyCheckIn`, `linkCheckInScene` to `src/actions/alchemy.ts`
- [ ] Wire: BAR creation → set channel; 321 completion → set channel
- [x] Run `npm run db:sync`

## AES-2: Scene Template Seed + Selection

- [x] Add `AlchemySceneTemplate` to schema (with `sceneType`, `targetChannel`, `status` fields)
- [x] Implement `selectScene(playerId, opts)` in `src/lib/alchemy/select-scene.ts` (filters by sceneType + status)
- [ ] Seed: transcend templates — at minimum 2 per channel × 3 altitudes = 30 templates
- [ ] Seed: generate templates — 15 templates across shēng cycle
- [ ] Seed: control templates — 15 templates across kè cycle

## AES-3: Wuxing Routing

- [x] Implement `src/lib/alchemy/wuxing.ts` — shēng/kè cycles, `resolveMoveDestination`, `shengTarget`, `keTarget`
- [x] Update `generateScene` in `src/lib/growth-scene/generator.ts` to use wuxing routing for all 3 scene types
- [x] Update `SceneDsl` type with `sceneType` + `targetChannel`

## AES-4: Daily Check-In Quest (Dashboard)

- [x] Build `DailyCheckInQuest` client component — 4-step wizard (stuckness → channel → altitude → move type)
- [x] Add to dashboard under player identity section
- [ ] Remove `AlchemyStateWidget` from `/wallet` page (superseded by DailyCheckInQuest)

## AES-5: EFA Integration

- [ ] Wire EFA completion to auto-set alchemy state (channel + altitude)
- [ ] Surface check-in prompt after quest/321 completion

## AES-6: Emotional Vector Canonization (EVC)

- [ ] See spec: [emotional-vector-canonization/spec.md](../emotional-vector-canonization/spec.md)
- [ ] Canonical types + docs for Transcend vs Translate distinction
